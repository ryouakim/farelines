import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''
const client = new MongoClient(MONGODB_URI)

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mock } = await request.json()
    console.log(`Manual trigger started by ${session.user.email}, mock mode: ${mock}`)

    await client.connect()
    const db = client.db('bearlines')
    
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
        if (mock) {
          // Mock mode: simulate price updates with random savings
          const mockSavings = Math.floor(Math.random() * 500) + 50
          const newPrice = trip.paidPrice - mockSavings
          
          await db.collection('trips').updateOne(
            { _id: trip._id },
            {
              $set: {
                lastCheckedPrice: newPrice,
                lastCheckedAt: new Date(),
                lowestSeen: Math.min(trip.lowestSeen || trip.paidPrice, newPrice)
              }
            }
          )
          
          successful++
          
          // Generate alert for significant savings
          if (mockSavings > 100) {
            alerts++
            
            // Log the alert (in production, this would send an email)
            await db.collection('alerts').insertOne({
              tripId: trip._id,
              userEmail: trip.userEmail,
              tripName: trip.tripName,
              oldPrice: trip.paidPrice,
              newPrice: newPrice,
              savings: mockSavings,
              createdAt: new Date()
            })
            
            console.log(`Alert created for trip ${trip.tripName}: $${mockSavings} savings`)
          }
        } else {
          // Real mode: just mark as checked for now
          await db.collection('trips').updateOne(
            { _id: trip._id },
            {
              $set: {
                lastCheckedAt: new Date(),
                needsCheck: false
              }
            }
          )
          successful++
        }
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