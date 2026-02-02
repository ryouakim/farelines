import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    const trips = await db.collection('trips')
      .find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { db } = await connectToDatabase()
    
    const trip = {
      ...body,
      userEmail: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    }
    
    const result = await db.collection('trips').insertOne(trip)
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      trip: { ...trip, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}