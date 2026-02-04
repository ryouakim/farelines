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
    
    // Get user's trips statistics
    const userTrips = await db.collection('trips')
      .find({ userEmail: session.user.email })
      .toArray()

    // Calculate monitoring stats
    const totalTrips = userTrips.length
    const monitoringTrips = userTrips.filter(trip => 
      trip.status !== 'inactive' && 
      trip.flights && 
      trip.flights.length > 0
    ).length

    // Calculate potential savings from recent checks
    let totalSavings = 0
    let recentAlerts = 0
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get recent alerts for this user
    const alerts = await db.collection('alerts')
      .find({ 
        userEmail: session.user.email,
        sentAt: { $gte: thirtyDaysAgo }
      })
      .sort({ sentAt: -1 })
      .limit(50)
      .toArray()

    recentAlerts = alerts.length
    totalSavings = alerts.reduce((sum, alert) => sum + (alert.savings || 0), 0)

    // Find most recent check time
    const lastChecked = userTrips.reduce((latest, trip) => {
      const tripLastCheck = trip.lastCheckedAt ? new Date(trip.lastCheckedAt) : null
      if (!tripLastCheck) return latest
      if (!latest || tripLastCheck > latest) return tripLastCheck
      return latest
    }, null)

    // Calculate average savings
    const avgSavings = recentAlerts > 0 ? totalSavings / recentAlerts : 0

    // Get recent price check results from trip data
    const recentCheckResults = userTrips
      .filter(trip => trip.lastCheckedAt)
      .map(trip => ({
        tripId: trip._id,
        success: trip.lastCheckError ? 0 : 1,
        error: trip.lastCheckError ? 1 : 0,
        timestamp: trip.lastCheckedAt,
        currentPrice: trip.lastCheckedPrice,
        priceSource: trip.priceSource || 'unknown'
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Aggregate last check results
    const lastCheckSummary = recentCheckResults.length > 0 ? {
      total: recentCheckResults.length,
      success: recentCheckResults.reduce((sum, r) => sum + r.success, 0),
      errors: recentCheckResults.reduce((sum, r) => sum + r.error, 0),
      timestamp: recentCheckResults[0].timestamp,
      usedMockPrices: recentCheckResults.some(r => r.priceSource === 'mock')
    } : null

    const stats = {
      totalTrips,
      monitoringTrips,
      totalSavings: Math.round(totalSavings),
      avgSavings: Math.round(avgSavings),
      lastChecked: lastChecked?.toISOString(),
      recentAlerts
    }

    return NextResponse.json({
      stats,
      lastCheck: lastCheckSummary,
      recentAlerts: alerts.slice(0, 5) // Return 5 most recent alerts
    })

  } catch (error) {
    console.error('Error fetching monitoring stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring stats' },
      { status: 500 }
    )
  }
}