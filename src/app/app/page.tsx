'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Plane,
  TrendingDown,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  ExternalLink,
  Archive,
  ChevronRight,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate, generateTripStatus } from '@/lib/utils'
import type { Trip } from '@/types/trip'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchTrips()
    }
  }, [status, router])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return
    
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchTrips()
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  const handleArchiveTrip = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      })
      
      if (response.ok) {
        fetchTrips()
      }
    } catch (error) {
      console.error('Error archiving trip:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Filter and categorize trips
  const now = new Date()
  const activeTrips = trips
    .filter(trip => {
      if (trip.isArchived) return false
      return trip.flights.some(flight => new Date(flight.date) > now)
    })
    .sort((a, b) => {
      const aDate = new Date(a.flights[0]?.date || '')
      const bDate = new Date(b.flights[0]?.date || '')
      return aDate.getTime() - bDate.getTime()
    })

  const pastTrips = trips
    .filter(trip => {
      return !trip.isArchived && trip.flights.every(flight => new Date(flight.date) <= now)
    })

  // Calculate stats for active trips
  const totalActiveMonitoring = activeTrips.filter(t => t.status === 'active').length
  const totalSavings = activeTrips.reduce((sum, trip) => {
    if (trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice) {
      return sum + (trip.paidPrice - trip.lastCheckedPrice)
    }
    return sum
  }, 0)
  const avgSavings = activeTrips.length > 0 ? totalSavings / activeTrips.length : 0

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your flights and never miss a price drop
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold">{activeTrips.length}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Monitoring</p>
                    <p className="text-2xl font-bold">{totalActiveMonitoring}</p>
                    <p className="text-xs text-muted-foreground">Currently tracking</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">Potential savings</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Savings</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(avgSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">Per trip</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trips Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Trips</h2>
              <Link href="/app/trips/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Trip
                </Button>
              </Link>
            </div>

            {activeTrips.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mb-4">
                    <Plane className="h-16 w-16 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No active trips</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first trip to start tracking prices
                  </p>
                  <Link href="/app/trips/new">
                    <Button>Add Your First Trip</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTrips.map((trip) => {
                  const savings = trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice 
                    ? trip.paidPrice - trip.lastCheckedPrice 
                    : 0
                  const savingsPercent = savings > 0 
                    ? Math.round((savings / trip.paidPrice) * 100) 
                    : 0
                  
                  return (
                    <Card key={trip._id?.toString()} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg truncate">{trip.tripName}</h3>
                            <p className="text-sm text-muted-foreground">PNR: {trip.recordLocator}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/app/trips/${trip._id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteTrip(trip._id?.toString() || '')}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex gap-2 mb-4">
                          {trip.status === 'active' && (
                            <Badge variant="default" className="bg-green-500">
                              Monitoring
                            </Badge>
                          )}
                          {savingsPercent > 0 && (
                            <Badge variant="default" className="bg-emerald-600">
                              Save {savingsPercent}%
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {trip.fareType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>

                        {/* Flight Routes */}
                        <div className="space-y-2 mb-4">
                          {trip.flights.slice(0, 2).map((flight, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <span className="font-medium">{flight.origin}</span>
                                <ChevronRight className="h-3 w-3 mx-1" />
                                <span className="font-medium">{flight.destination}</span>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {formatDate(flight.date)}
                              </span>
                            </div>
                          ))}
                          {trip.flights.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{trip.flights.length - 2} more flights
                            </p>
                          )}
                        </div>

                        {/* Pricing Information */}
                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Paid Price:</span>
                            <span className="font-semibold">{formatCurrency(trip.paidPrice)}</span>
                          </div>
                          
                          {trip.lastCheckedPrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Current Price:</span>
                              <span className={`font-semibold ${
                                trip.lastCheckedPrice < trip.paidPrice 
                                  ? 'text-green-600' 
                                  : ''
                              }`}>
                                {formatCurrency(trip.lastCheckedPrice)}
                              </span>
                            </div>
                          )}
                          
                          {savings > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Potential Savings:</span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(savings)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Last Checked */}
                        {trip.lastCheckedAt && (
                          <p className="text-xs text-muted-foreground mt-3 flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Last checked {formatDate(trip.lastCheckedAt)}
                          </p>
                        )}

                        {/* View Details Button */}
                        <Link href={`/app/trips/${trip._id}`}>
                          <Button className="w-full mt-4" variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past/Completed Trips */}
          {pastTrips.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-600">Recently Completed</h2>
              <div className="space-y-2">
                {pastTrips.slice(0, 3).map((trip) => (
                  <Card key={trip._id?.toString()} className="bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Archive className="h-5 w-5 text-gray-400" />
                          <div>
                            <span className="font-medium">{trip.tripName}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              • {trip.flights[0]?.origin} → {trip.flights[0]?.destination}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(trip.flights[0]?.date)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveTrip(trip._id?.toString() || '')}
                          >
                            Archive
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {pastTrips.length > 3 && (
                <div className="mt-4 text-center">
                  <Link href="/app/history">
                    <Button variant="outline" size="sm">
                      View All Past Trips ({pastTrips.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}