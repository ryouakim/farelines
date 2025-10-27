import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTripsCollection, getWorkerQueueCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { 
  normalizeFlightNumber, 
  normalizeIataCode, 
  normalizePnr,
  parseGoogleFlightsUrl 
} from '@/lib/utils'

// Update schema
const updateTripSchema = z.object({
  tripName: z.string().min(1).optional(),
  paidPrice: z.number().min(0).optional(),
  fareType: z.enum(['basic_economy', 'main_cabin', 'main_plus', 'main_select', 'premium_economy', 'business', 'first']).optional(),
  thresholdUsd: z.number().min(1).optional(),
  status: z.enum(['active', 'completed', 'expired', 'paused']).optional(),
  flights: z.array(z.object({
    flightNumber: z.string(),
    date: z.string(),
    origin: z.string().length(3),
    destination: z.string().length(3),
    departureTimeLocal: z.string().optional(),
    departureTz: z.string().optional(),
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await getTripsCollection()
    const trip = await trips.findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = updateTripSchema.safeParse(body)
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
    const updateData: any = {
      updatedAt: new Date(),
      needsCheck: true, // Flag for worker to recheck
    }

    // Add fields that were provided
    if (data.tripName) updateData.tripName = data.tripName
    if (data.paidPrice !== undefined) {
      updateData.paidPrice = data.paidPrice
      updateData.bookedPrice = data.paidPrice // backward compatibility
    }
    if (data.fareType) updateData.fareType = data.fareType
    if (data.thresholdUsd !== undefined) updateData.thresholdUsd = data.thresholdUsd
    if (data.status) updateData.status = data.status

    // Handle flights update
    if (data.flights) {
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
      updateData.flights = normalizedFlights
    }

    const trips = await getTripsCollection()
    const result = await trips.updateOne(
      { 
        _id: new ObjectId(params.id),
        userEmail: session.user.email 
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Add to worker queue for rechecking
    const queue = await getWorkerQueueCollection()
    await queue.insertOne({
      tripId: params.id,
      reason: 'updated',
      priority: 2,
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await getTripsCollection()
    
    // Soft delete by archiving
    const result = await trips.updateOne(
      { 
        _id: new ObjectId(params.id),
        userEmail: session.user.email 
      },
      { 
        $set: { 
          isArchived: true,
          status: 'completed',
          updatedAt: new Date() 
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
