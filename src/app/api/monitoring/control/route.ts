import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST /api/monitoring/control - Control monitoring for specific trips or all trips
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, tripIds, settings } = body
    const { db } = await connectToDatabase()

    let result;

    switch (action) {
      case 'enable_monitoring':
        result = await enableMonitoring(db, session.user.email, tripIds, settings)
        break
      
      case 'disable_monitoring':
        result = await disableMonitoring(db, session.user.email, tripIds)
        break
      
      case 'update_intervals':
        result = await updateCheckIntervals(db, session.user.email, tripIds, settings)
        break
      
      case 'trigger_manual_check':
        result = await triggerManualCheck(db, session.user.email, tripIds)
        break
      
      case 'set_user_preferences':
        result = await setUserPreferences(db, session.user.email, settings)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Monitoring control error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/monitoring/control - Get monitoring status and user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const url = new URL(req.url)
    const tripId = url.searchParams.get('tripId')

    if (tripId) {
      // Get specific trip monitoring status
      const trip = await db.collection('trips').findOne({
        _id: new ObjectId(tripId),
        userEmail: session.user.email
      })

      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }

      return NextResponse.json({
        tripId: trip._id,
        monitoringEnabled: trip.checkEnabled !== false,
        checkInterval: trip.checkEveryMinutes || 360,
        nextCheckAt: trip.nextCheckAt,
        lastCheckedAt: trip.lastCheckedAt,
        status: getTripMonitoringStatus(trip)
      })
    }

    // Get user's overall monitoring settings
    const trips = await db.collection('trips')
      .find({ userEmail: session.user.email })
      .toArray()

    const user = await db.collection('users')
      .findOne({ email: session.user.email })

    const monitoringStats = {
      totalTrips: trips.length,
      monitoringEnabled: trips.filter(t => t.checkEnabled !== false).length,
      averageInterval: calculateAverageInterval(trips),
      userPreferences: user?.monitoringPreferences || getDefaultUserPreferences()
    }

    return NextResponse.json(monitoringStats)

  } catch (error) {
    console.error('Get monitoring status error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    )
  }
}

// Helper functions
async function enableMonitoring(db, userEmail, tripIds, settings = {}) {
  const filter = tripIds && tripIds.length > 0
    ? { _id: { $in: tripIds.map(id => new ObjectId(id)) }, userEmail }
    : { userEmail }

  const update = {
    $set: {
      checkEnabled: true,
      checkEveryMinutes: settings.interval || 360,
      nextCheckAt: new Date(), // Check immediately
      enabledAt: new Date()
    },
    $unset: {
      disabledAt: 1,
      failureCount: 1
    }
  }

  const result = await db.collection('trips').updateMany(filter, update)
  
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    interval: settings.interval || 360
  }
}

async function disableMonitoring(db, userEmail, tripIds) {
  const filter = tripIds && tripIds.length > 0
    ? { _id: { $in: tripIds.map(id => new ObjectId(id)) }, userEmail }
    : { userEmail }

  const update = {
    $set: {
      checkEnabled: false,
      disabledAt: new Date()
    },
    $unset: {
      nextCheckAt: 1
    }
  }

  const result = await db.collection('trips').updateMany(filter, update)
  
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  }
}

async function updateCheckIntervals(db, userEmail, tripIds, settings) {
  if (!settings.interval || settings.interval < 60 || settings.interval > 1440) {
    throw new Error('Check interval must be between 60 and 1440 minutes')
  }

  const filter = tripIds && tripIds.length > 0
    ? { _id: { $in: tripIds.map(id => new ObjectId(id)) }, userEmail }
    : { userEmail }

  const update = {
    $set: {
      checkEveryMinutes: settings.interval,
      intervalUpdatedAt: new Date()
    }
  }

  const result = await db.collection('trips').updateMany(filter, update)
  
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    newInterval: settings.interval
  }
}

async function triggerManualCheck(db, userEmail, tripIds) {
  // Create manual check jobs
  const jobs = []
  
  if (tripIds && tripIds.length > 0) {
    // Individual trip checks
    for (const tripId of tripIds) {
      jobs.push({
        type: 'manual_check',
        tripId: new ObjectId(tripId),
        userEmail,
        status: 'pending',
        priority: 10,
        createdAt: new Date()
      })
    }
  } else {
    // Check all user trips
    jobs.push({
      type: 'user_trigger',
      userEmail,
      status: 'pending',
      priority: 10,
      createdAt: new Date()
    })
  }

  const result = await db.collection('price_check_jobs').insertMany(jobs)
  
  return {
    jobsQueued: result.insertedCount,
    jobIds: Object.values(result.insertedIds)
  }
}

async function setUserPreferences(db, userEmail, preferences) {
  const allowedPreferences = [
    'defaultCheckInterval',
    'maxAlertsPerDay',
    'alertCooldownHours',
    'priceDropThreshold',
    'percentageThreshold',
    'timeZone',
    'quietHours'
  ]

  const cleanPreferences = {}
  for (const [key, value] of Object.entries(preferences)) {
    if (allowedPreferences.includes(key)) {
      cleanPreferences[key] = value
    }
  }

  const update = {
    $set: {
      monitoringPreferences: cleanPreferences,
      preferencesUpdatedAt: new Date()
    }
  }

  await db.collection('users').updateOne(
    { email: userEmail },
    update,
    { upsert: true }
  )

  return cleanPreferences
}

function getTripMonitoringStatus(trip) {
  if (trip.checkEnabled === false) return 'disabled'
  if (!trip.flights || trip.flights.length === 0) return 'no_flights'
  if (trip.flights[0].date < new Date().toISOString().slice(0, 10)) return 'expired'
  if (trip.lastCheckError) return 'error'
  if (!trip.lastCheckedAt) return 'pending_first_check'
  
  const hoursSinceCheck = (Date.now() - new Date(trip.lastCheckedAt).getTime()) / (1000 * 60 * 60)
  if (hoursSinceCheck > 48) return 'stale'
  
  return 'active'
}

function calculateAverageInterval(trips) {
  const enabledTrips = trips.filter(t => t.checkEnabled !== false)
  if (enabledTrips.length === 0) return 360
  
  const total = enabledTrips.reduce((sum, trip) => 
    sum + (trip.checkEveryMinutes || 360), 0)
  
  return Math.round(total / enabledTrips.length)
}

function getDefaultUserPreferences() {
  return {
    defaultCheckInterval: 360, // 6 hours
    maxAlertsPerDay: 3,
    alertCooldownHours: 12,
    priceDropThreshold: 25, // $25
    percentageThreshold: 5, // 5%
    timeZone: 'America/New_York',
    quietHours: { start: '22:00', end: '08:00' }
  }
}