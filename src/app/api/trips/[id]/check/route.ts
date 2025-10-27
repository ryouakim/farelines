import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTripsCollection, getWorkerQueueCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the trip exists and belongs to the user
    const trips = await getTripsCollection()
    const trip = await trips.findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Add to worker queue with high priority
    const queue = await getWorkerQueueCollection()
    await queue.insertOne({
      tripId: params.id,
      reason: 'manual_check',
      priority: 0, // High priority
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
    })

    // Mark the trip as needing a check
    await trips.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          needsCheck: true,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      ok: true, 
      message: 'Price check initiated' 
    })
  } catch (error) {
    console.error('Error initiating price check:', error)
    return NextResponse.json(
      { error: 'Failed to initiate price check' },
      { status: 500 }
    )
  }
}
