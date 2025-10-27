import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTripsCollection, getWorkerQueueCollection } from '@/lib/mongodb'
import { 
  normalizeFlightNumber, 
  normalizeIataCode, 
  normalizePnr,
  parseGoogleFlightsUrl 
} from '@/lib/utils'
import { z } from 'zod'
import type { Trip, FareType } from '@/types/trip'

// Validation schema for creating a trip
const createTripSchema = z.object({
  tripName: z.string().min(1, 'Trip name is required'),
  recordLocator: z.string().length(6, 'PNR must be exactly 6 characters'),
  paxCount: z.number().min(1).max(9),
  ptc: z.string().default('ADT'),
  paidPrice: z.number().min(0, 'Paid price must be positive'),
  fareType: z.enum(['basic_economy', 'main_cabin', 'main_plus', 'main_select', 'premium_economy', 'business', 'first']),
  thresholdUsd: z.number().min(1).default(50),
  googleFlightsUrl: z.string().url().optional(),
  flights: z.array(z.object({
    flightNumber: z.string(),
    date: z.string(),
    origin: z.string().length(3),
    destination: z.string().length(3),
    departureTimeLocal: z.string().optional(),
    departureTz: z.string().optional(),
  })).min(1, 'At least one flight is required')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await getTripsCollection()
    const userTrips = await trips
      .find({ userEmail: session.user.email })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({ trips: userTrips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = createTripSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          fieldErrors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Normalize data
    const normalizedPnr = normalizePnr(data.recordLocator)
    
    // Parse Google Flights URL if provided
    let gfQuery: string | undefined
    let gfHash: string | undefined
    
    if (data.googleFlightsUrl) {
      const parsed = parseGoogleFlightsUrl(data.googleFlightsUrl)
      gfQuery = parsed.gfQuery
      gfHash = parsed.gfHash
    }

    // Normalize flights
    const normalizedFlights = data.flights.map(flight => {
      const { airline, number, formatted } = normalizeFlightNumber(flight.flightNumber)
      return {
        ...flight,
        flightNumber: formatted,
        airline,
        flightNumberNum: number,
        origin: normalizeIataCode(flight.origin),
        destination: normalizeIataCode(flight.destination),
        departureUtc: flight.departureTimeLocal ? new Date(`${flight.date}T${flight.departureTimeLocal}`) : undefined,
      }
    })

    // Create trip document
    const trip: Trip = {
      userEmail: session.user.email,
      tripName: data.tripName,
      recordLocator: normalizedPnr,
      paxCount: data.paxCount,
      ptc: data.ptc,
      paidPrice: data.paidPrice,
      bookedPrice: data.paidPrice, // for backward compatibility
      fareType: data.fareType as FareType,
      thresholdUsd: data.thresholdUsd,
      googleFlightsUrl: data.googleFlightsUrl,
      gfQuery,
      gfHash,
      flights: normalizedFlights,
      status: 'active',
      isArchived: false,
      needsCheck: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert trip
    const trips = await getTripsCollection()
    const result = await trips.insertOne(trip as any)

    // Add to worker queue
    const queue = await getWorkerQueueCollection()
    await queue.insertOne({
      tripId: result.insertedId.toString(),
      reason: 'created',
      priority: 1,
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      ok: true, 
      id: result.insertedId.toString() 
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}
