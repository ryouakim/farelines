// src/app/api/trips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema
const updateTripSchema = z.object({
  tripName: z.string().min(1).optional(),
  paidPrice: z.number().min(0).optional(),
  fareType: z.enum(['basic_economy', 'main_cabin', 'premium_economy', 'business', 'first', 'main_plus', 'main_select']).optional(),
  thresholdUsd: z.number().min(0).optional(),
  googleFlightsUrl: z.string().url().optional().or(z.literal('')),
  recordLocator: z.string().min(6).max(6).optional(),
  flights: z.array(z.object({
    flightNumber: z.string(),
    date: z.string(),
    origin: z.string().length(3),
    destination: z.string().length(3),
    departureTimeLocal: z.string().optional(),
  })).optional(),
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

    const { db } = await connectToDatabase()
    const trip = await db.collection('trips').findOne({
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
    console.log('Update trip request body:', body) // Debug log
    
    // Validate the input
    const validatedData = updateTripSchema.parse(body)
    console.log('Validated data:', validatedData) // Debug log

    const { db } = await connectToDatabase()
    
    // Check if trip exists and belongs to user
    const existingTrip = await db.collection('trips').findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      needsCheck: true // Mark for worker to check
    }

    // Add each field if provided
    if (validatedData.tripName !== undefined) updateData.tripName = validatedData.tripName
    if (validatedData.paidPrice !== undefined) updateData.paidPrice = validatedData.paidPrice
    if (validatedData.fareType !== undefined) updateData.fareType = validatedData.fareType
    if (validatedData.thresholdUsd !== undefined) updateData.thresholdUsd = validatedData.thresholdUsd
    if (validatedData.recordLocator !== undefined) updateData.recordLocator = validatedData.recordLocator.toUpperCase()
    if (validatedData.flights !== undefined) updateData.flights = validatedData.flights
    
    // Handle Google Flights URL specially
    if (validatedData.googleFlightsUrl !== undefined) {
      updateData.googleFlightsUrl = validatedData.googleFlightsUrl
      console.log('Setting googleFlightsUrl to:', validatedData.googleFlightsUrl) // Debug log
      
      // Parse URL for gfQuery and gfHash if URL provided
      if (validatedData.googleFlightsUrl) {
        try {
          const url = new URL(validatedData.googleFlightsUrl)
          updateData.gfQuery = validatedData.googleFlightsUrl
          
          // Extract tfs parameter for hash
          const tfs = url.searchParams.get('tfs')
          if (tfs) {
            const crypto = require('crypto')
            updateData.gfHash = crypto.createHash('md5').update(tfs).digest('hex')
          }
        } catch (urlError) {
          console.log('URL parsing failed:', urlError)
        }
      } else {
        // Clear URL fields if empty string provided
        updateData.gfQuery = ''
        updateData.gfHash = ''
      }
    }

    console.log('Final update data:', updateData) // Debug log

    // Update the trip
    const result = await db.collection('trips').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Fetch updated trip
    const updatedTrip = await db.collection('trips').findOne({
      _id: new ObjectId(params.id)
    })

    console.log('Updated trip googleFlightsUrl:', updatedTrip?.googleFlightsUrl) // Debug log

    return NextResponse.json({ 
      success: true, 
      trip: updatedTrip 
    })

  } catch (error) {
    console.error('Error updating trip:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

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

    const { db } = await connectToDatabase()
    
    const result = await db.collection('trips').deleteOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}