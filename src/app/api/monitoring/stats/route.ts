import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''
const client = new MongoClient(MONGODB_URI)

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await client.connect()
    const db = client.db('bearlines')
    
    // Get all trips for this user
    const trips = await db.collection('trips').find({
      userEmail: session.user.email
    }).toArray()

    // Calculate statistics
    const totalTrips = trips.length
    const now = new Date()
    
    // Filter active trips (future dates)
    const activeTrips = trips.filter(trip => {
      if (!trip.flights || !Array.isArray(trip.flights)) return false
      return trip.flights.some(flight => {
        if (!flight.date) return false
        return new Date(flight.date) > now
      })
    })
    
    const monitoringTrips = activeTrips.length
    
    // Calculate total savings
    let totalSavings = 0
    let savingsCount = 0
    
    trips.forEach(trip => {
      if (trip.paidPrice && trip.lastCheckedPrice && trip.lastCheckedPrice > 0) {
        const savings = trip.paidPrice - trip.lastCheckedPrice
        if (savings > 0) {
          totalSavings += savings
          savingsCount++
        }
      }
    })
    
    const avgSavings = savingsCount > 0 ? totalSavings / savingsCount : 0
    
    // Get recent alerts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentAlerts = await db.collection('alerts').countDocuments({
      userEmail: session.user.email,
      createdAt: { $gte: thirtyDaysAgo }
    })
    
    // Get last check info
    const lastCheckedTrips = trips.filter(trip => trip.lastCheckedAt)
    const recentChecks = lastCheckedTrips.filter(trip => {
      const lastCheck = new Date(trip.lastCheckedAt)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return lastCheck > oneHourAgo
    })
    
    const lastCheckSummary = {
      timestamp: lastCheckedTrips.length > 0 
        ? Math.max(...lastCheckedTrips.map(t => new Date(t.lastCheckedAt).getTime()))
        : null,
      totalChecked: recentChecks.length,
      successful: recentChecks.filter(t => t.lastCheckedPrice > 0).length,
      errors: recentChecks.filter(t => !t.lastCheckedPrice || t.lastCheckedPrice <= 0).length
    }

    return NextResponse.json({
      totalTrips,
      monitoringTrips,
      totalSavings: Math.round(totalSavings),
      avgSavings: Math.round(avgSavings),
      recentAlerts: recentAlerts || 0,
      lastCheck: {
        timestamp: lastCheckSummary.timestamp ? new Date(lastCheckSummary.timestamp).toISOString() : null,
        successful: lastCheckSummary.successful,
        errors: lastCheckSummary.errors,
        totalChecked: lastCheckSummary.totalChecked
      }
    })
  } catch (error) {
    console.error('Error fetching monitoring stats:', error)
    
    // Return fallback data on error
    return NextResponse.json({
      totalTrips: 0,
      monitoringTrips: 0,
      totalSavings: 0,
      avgSavings: 0,
      recentAlerts: 0,
      lastCheck: {
        timestamp: null,
        successful: 0,
        errors: 0,
        totalChecked: 0
      }
    })
  } finally {
    await client.close()
  }
}