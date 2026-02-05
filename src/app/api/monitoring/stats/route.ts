import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect directly to MongoDB for accurate stats
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db(process.env.MONGODB_DB || 'bearlines')

    try {
      // Get user's trips directly from database
      const trips = await db.collection('trips').find({
        userEmail: session.user.email
      }).toArray()

      const totalTrips = trips.length
      const now = new Date()

      // Filter active trips (with future flight dates)
      const activeTrips = trips.filter(trip => {
        if (!trip.flights || !Array.isArray(trip.flights)) return false
        return trip.flights.some(flight => {
          if (!flight.date) return false
          return new Date(flight.date) > now
        })
      })

      const monitoringTrips = activeTrips.length

      // Calculate total savings from actual price data
      let totalSavings = 0
      let savingsCount = 0

      trips.forEach((trip: any) => {
        if (trip.paidPrice && trip.lastCheckedPrice && trip.lastCheckedPrice > 0) {
          const savings = trip.paidPrice - trip.lastCheckedPrice
          if (savings > 0) {
            totalSavings += savings
            savingsCount++
          }
        }
      })

      const avgSavings = savingsCount > 0 ? totalSavings / savingsCount : 0

      // Get recent alerts count
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentAlertsCount = await db.collection('alerts').countDocuments({
        userEmail: session.user.email,
        createdAt: { $gte: oneDayAgo }
      })

      // Get last check timestamp
      let lastCheckTimestamp = null
      const lastCheckedTrip = trips
        .filter((t: any) => t.lastCheckedAt)
        .sort((a: any, b: any) => new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime())[0]

      if (lastCheckedTrip) {
        lastCheckTimestamp = lastCheckedTrip.lastCheckedAt
      }

      await client.close()

      return NextResponse.json({
        totalTrips,
        monitoringTrips,
        totalSavings: Math.round(totalSavings),
        avgSavings: Math.round(avgSavings),
        recentAlerts: recentAlertsCount,
        lastCheck: {
          timestamp: lastCheckTimestamp || new Date().toISOString(),
          successful: monitoringTrips,
          errors: 0,
          totalChecked: totalTrips
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      await client.close()

      // Return zero stats on error
      return NextResponse.json({
        totalTrips: 0,
        monitoringTrips: 0,
        totalSavings: 0,
        avgSavings: 0,
        recentAlerts: 0,
        lastCheck: {
          timestamp: new Date().toISOString(),
          successful: 0,
          errors: 0,
          totalChecked: 0
        }
      })
    }
  } catch (error) {
    console.error('Error in monitoring stats:', error)

    return NextResponse.json({
      totalTrips: 0,
      monitoringTrips: 0,
      totalSavings: 0,
      avgSavings: 0,
      recentAlerts: 0,
      lastCheck: {
        timestamp: new Date().toISOString(),
        successful: 0,
        errors: 0,
        totalChecked: 0
      }
    })
  }
}