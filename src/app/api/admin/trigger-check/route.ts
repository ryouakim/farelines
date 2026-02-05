import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { MongoClient } from 'mongodb'
import { authOptions } from '@/lib/auth'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''
const client = new MongoClient(MONGODB_URI)

// Amadeus API token cache
let amadeusToken: string | null = null
let tokenExpiry: number | null = null

/**
 * Get OAuth access token from Amadeus API
 */
async function getAmadeusToken(): Promise<string | null> {
  if (amadeusToken && tokenExpiry && Date.now() < tokenExpiry) {
    return amadeusToken
  }

  const apiKey = process.env.AMADEUS_API_KEY
  const apiSecret = process.env.AMADEUS_API_SECRET

  if (!apiKey || !apiSecret) {
    console.log('Amadeus API credentials not configured')
    return null
  }

  try {
    const baseUrl = process.env.AMADEUS_USE_PRODUCTION === 'true'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com'

    const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
    })

    if (!response.ok) {
      console.error('Amadeus auth failed:', await response.text())
      return null
    }

    const data = await response.json()
    amadeusToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000
    console.log('Amadeus token obtained successfully')
    return amadeusToken
  } catch (error) {
    console.error('Error getting Amadeus token:', error)
    return null
  }
}

/**
 * Search for flight offers using Amadeus API
 */
async function searchAmadeusFlights(
  origin: string,
  destination: string,
  departureDate: string,
  adults: number = 1
): Promise<any> {
  const token = await getAmadeusToken()
  if (!token) return null

  try {
    const baseUrl = process.env.AMADEUS_USE_PRODUCTION === 'true'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com'

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults.toString(),
      currencyCode: 'USD',
      max: '10'
    })

    const response = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Amadeus search failed:', await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching Amadeus flights:', error)
    return null
  }
}

/**
 * Get real flight prices using Amadeus API
 */
async function getRealFlightPrices(trip: any): Promise<{ price: number; source: string } | null> {
  if (!trip.flights || trip.flights.length === 0) {
    return null
  }

  const hasAmadeusConfig = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET
  if (!hasAmadeusConfig) {
    return null
  }

  try {
    let totalPrice = 0

    for (const flight of trip.flights) {
      if (!flight.origin || !flight.destination || !flight.date) {
        continue
      }

      const offers = await searchAmadeusFlights(
        flight.origin,
        flight.destination,
        flight.date,
        trip.paxCount || 1
      )

      if (offers?.data && offers.data.length > 0) {
        // Find lowest price for this segment
        const lowestOffer = offers.data.reduce((min: any, offer: any) => {
          const price = parseFloat(offer.price.total)
          return price < parseFloat(min.price.total) ? offer : min
        }, offers.data[0])

        totalPrice += parseFloat(lowestOffer.price.total)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (totalPrice > 0) {
      return { price: Math.round(totalPrice), source: 'amadeus' }
    }
  } catch (error) {
    console.error('Amadeus API error:', error)
  }

  return null
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('Trigger check: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mock } = await request.json()
    console.log(`Manual trigger started by ${session.user.email}, mock mode: ${mock}`)

    await client.connect()
    const dbName = process.env.MONGODB_DB || 'bearlines'
    const db = client.db(dbName)
    console.log(`Connected to database: ${dbName}`)
    
    // Query trips the same way your dashboard does
    const userTrips = await db.collection('trips').find({
      userEmail: session.user.email
    }).toArray()

    console.log(`Found ${userTrips.length} trips for user ${session.user.email}`)

    if (userTrips.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trips found for monitoring',
        results: {
          processed: 0,
          successful: 0,
          errors: 0,
          alerts: 0
        }
      })
    }

    // Filter active trips (with future flight dates)
    const now = new Date()
    const activeTrips = userTrips.filter(trip => {
      if (!trip.flights || !Array.isArray(trip.flights)) return false
      return trip.flights.some(flight => {
        if (!flight.date) return false
        return new Date(flight.date) > now
      })
    })

    console.log(`Found ${activeTrips.length} active trips to process`)

    let successful = 0
    let errors = 0
    let alerts = 0

    // Process each active trip
    for (const trip of activeTrips) {
      try {
        let newPrice: number
        let priceSource: string

        if (mock) {
          // Mock mode: simulate price updates with random savings
          const mockSavings = Math.floor(Math.random() * 500) + 50
          newPrice = trip.paidPrice - mockSavings
          priceSource = 'mock'
        } else {
          // Real mode: try Amadeus API first
          const realPrice = await getRealFlightPrices(trip)

          if (realPrice) {
            newPrice = realPrice.price
            priceSource = realPrice.source
            console.log(`Real price for ${trip.tripName}: $${newPrice} (from ${priceSource})`)
          } else {
            // No Amadeus API available - use mock fallback if enabled (default: true)
            const enableMockFallback = process.env.ENABLE_MOCK_FALLBACK !== 'false'
            if (enableMockFallback) {
              // Generate mock price with variance
              const mockSavings = Math.floor(Math.random() * 200) - 50 // -50 to +150 variance
              newPrice = Math.max(50, trip.paidPrice + mockSavings)
              priceSource = 'mock'
              console.log(`Using mock price for ${trip.tripName}: $${newPrice} (no Amadeus API)`)
            } else {
              // Just mark as checked without updating price
              await db.collection('trips').updateOne(
                { _id: trip._id },
                {
                  $set: {
                    lastCheckedAt: new Date(),
                    needsCheck: false,
                    lastCheckError: 'No price source available'
                  }
                }
              )
              successful++
              continue
            }
          }
        }

        // Build update data
        const updateData: any = {
          lastCheckedPrice: newPrice,
          lastCheckedAt: new Date(),
          needsCheck: false,
          priceSource: priceSource
        }

        // Update lowest seen if this is a new low
        const currentLowest = trip.lowestSeenPrice || trip.lowestSeen || trip.paidPrice
        if (newPrice < currentLowest) {
          updateData.lowestSeenPrice = newPrice
          updateData.lowestSeen = newPrice
          updateData.lowestSeenDate = new Date()
        }

        // Add to price history
        const priceHistoryEntry = {
          price: newPrice,
          date: new Date(),
          source: priceSource
        }

        await db.collection('trips').updateOne(
          { _id: trip._id },
          {
            $set: updateData,
            $push: {
              priceHistory: {
                $each: [priceHistoryEntry],
                $slice: -50 // Keep last 50 price points
              }
            }
          }
        )

        successful++

        // Calculate savings
        const savings = trip.paidPrice - newPrice

        // Generate alert for significant savings (over $100 or threshold)
        const threshold = trip.thresholdUsd || 100
        if (savings >= threshold) {
          alerts++

          // Log the alert
          await db.collection('alerts').insertOne({
            tripId: trip._id,
            userEmail: trip.userEmail,
            tripName: trip.tripName,
            oldPrice: trip.paidPrice,
            newPrice: newPrice,
            savings: savings,
            priceSource: priceSource,
            createdAt: new Date()
          })

          console.log(`Alert created for trip ${trip.tripName}: $${savings} savings`)
        }

        // Rate limiting between trips
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error processing trip ${trip._id}:`, error)
        errors++
      }
    }

    const results = {
      processed: activeTrips.length,
      successful,
      errors,
      alerts
    }

    console.log('Manual trigger completed:', results)

    return NextResponse.json({
      success: true,
      message: mock 
        ? `Mock price check completed on ${activeTrips.length} trips`
        : `Price check completed on ${activeTrips.length} trips`,
      results
    })
  } catch (error) {
    console.error('Error in manual trigger:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      results: {
        processed: 0,
        successful: 0,
        errors: 1,
        alerts: 0
      }
    }, { status: 500 })
  } finally {
    await client.close()
  }
}