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
  Archive
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
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
        fetchTrips() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
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
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
      // Not archived
      if (trip.isArchived) return false
      // Has at least one future flight
      return trip.flights.some(flight => new Date(flight.date) > now)
    })
    .sort((a, b) => {
      // Sort by earliest flight date
      const aDate = new Date(a.flights[0]?.date || '')
      const bDate = new Date(b.flights[0]?.date || '')
      return aDate.getTime() - bDate.getTime()
    })

  const pastTrips = trips
    .filter(trip => {
      // All flights are in the past
      return !trip.isArchived && trip.flights.every(flight => new Date(flight.date) <= now)
    })

  const archivedTrips = trips.filter(trip => trip.isArchived)

  // Calculate stats only for active trips
  const totalActiveMonitoring = activeTrips.filter(t => t.status === 'active').length
  const totalSavings = activeTrips.reduce((sum, trip) => {
    if (trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice) {
      return sum + (trip.paidPrice - trip.lastCheckedPrice)
    }
    return sum
  }, 0)

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

          {/* Stats Cards - Only for Active Trips */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Trips</p>
                    <p className="text-2xl font-bold">{activeTrips.length}</p>
                  </div>
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold">{totalActiveMonitoring}</p>
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
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {activeTrips.length > 0 
                        ? formatCurrency(totalSavings / activeTrips.length)
                        : '$0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trips Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Active Trips</h2>
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
              <div className="grid gap-4">
                {activeTrips.map((trip) => (
                  <Card key={trip._id?.toString()} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{trip.tripName}</h3>
                          <p className="text-sm text-muted-foreground">
                            PNR: {trip.recordLocator}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {trip.status === 'active' && (
                            <Badge variant="default" className="bg-green-500">
                              Monitoring
                            </Badge>
                          )}
                          {trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice && (
                            <Badge variant="default" className="bg-emerald-600">
                              Save {formatCurrency(trip.paidPrice - trip.lastCheckedPrice)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {trip.flights.map((flight, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{flight.origin} → {flight.destination}</span>
                            <span className="ml-auto text-muted-foreground">
                              {formatDate(flight.date)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Paid: </span>
                            <span className="font-medium">{formatCurrency(trip.paidPrice)}</span>
                          </div>
                          {trip.lastCheckedPrice && (
                            <div>
                              <span className="text-muted-foreground">Current: </span>
                              <span className={`font-medium ${
                                trip.lastCheckedPrice < trip.paidPrice 
                                  ? 'text-green-600' 
                                  : ''
                              }`}>
                                {formatCurrency(trip.lastCheckedPrice)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link href={`/app/trips/${trip._id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/app/trips/${trip._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTrip(trip._id?.toString() || '')}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Trips Section */}
          {pastTrips.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-600">Recently Completed Trips</h2>
              <div className="grid gap-4">
                {pastTrips.map((trip) => (
                  <Card key={trip._id?.toString()} className="opacity-75">
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{trip.tripName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatDate(trip.flights[0]?.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Completed</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/app/trips/${trip._id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Archive the trip
                              fetch(`/api/trips/${trip._id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isArchived: true })
                              }).then(() => fetchTrips())
                            }}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/app/history">
                  <Button variant="outline">View All Past Trips</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}