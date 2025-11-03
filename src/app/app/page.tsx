'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Trip } from '@/types/trip'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchTrips()
    }
  }, [status, router])

  // Keyboard shortcut for new trip
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        router.push('/app/trips/new')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])

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

  const refreshAllTrips = async () => {
    setRefreshing(true)
    try {
      // This would trigger price checks for all trips
      await fetch('/api/trips/check-all', { method: 'POST' })
      await fetchTrips()
    } catch (error) {
      console.error('Error refreshing trips:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleArchiveTrip = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  // Loading skeleton
  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48" />
                </CardContent>
              </Card>
            ))}
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
    .sort((a, b) => {
      const aDate = new Date(a.flights[0]?.date || '')
      const bDate = new Date(b.flights[0]?.date || '')
      return bDate.getTime() - aDate.getTime()
    })

  // Calculate stats for active trips only
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Breadcrumbs */}
          <nav className="text-sm mb-6">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li className="text-foreground font-medium">Dashboard</li>
            </ol>
          </nav>

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your flights and never miss a price drop
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold">{activeTrips.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active flights</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold">{totalActiveMonitoring || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Price tracking</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalSavings || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Potential</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(avgSavings || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Per trip</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trips Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Your Trips</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={refreshAllTrips}
                  disabled={refreshing}
                  className="flex-1 sm:flex-initial"
                >
                  {refreshing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh All
                </Button>
                <Link href="/app/trips/new" className="flex-1 sm:flex-initial">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trip
                    <span className="ml-2 text-xs opacity-70 hidden sm:inline">(⌘N)</span>
                  </Button>
                </Link>
              </div>
            </div>

            {activeTrips.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <div className="mb-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Plane className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No active trips</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Add your first trip to start tracking prices and saving money on flights
                  </p>
                  <Link href="/app/trips/new">
                    <Button size="lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Trip
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeTrips.map((trip) => {
                  const savings = trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice 
                    ? trip.paidPrice - trip.lastCheckedPrice 
                    : 0
                  const savingsPercent = savings > 0 
                    ? Math.round((savings / trip.paidPrice) * 100) 
                    : 0
                  
                  return (
                    <Card key={trip._id?.toString()} className="overflow-hidden hover:shadow-lg transition-all duration-200 border">
                      <CardContent className="p-0">
                        {/* Card Header */}
                        <div className="p-4 pb-3 border-b bg-muted/30">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate text-foreground">
                                {trip.tripName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                PNR: {trip.recordLocator}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/app/trips/${trip._id}/edit`)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => handleDeleteTrip(trip._id?.toString() || '', e)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {trip.status === 'active' && (
                              <Badge variant="default" className="bg-green-500 text-white">
                                Monitoring
                              </Badge>
                            )}
                            {savingsPercent > 0 && (
                              <Badge variant="default" className="bg-emerald-600 text-white">
                                Save {savingsPercent}%
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {trip.fareType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                        </div>

                        {/* Flight Routes */}
                        <div className="p-4 space-y-2">
                          {trip.flights.slice(0, 2).map((flight, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-foreground">{flight.origin}</span>
                                <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                                <span className="font-medium text-foreground">{flight.destination}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(flight.date)}
                              </span>
                            </div>
                          ))}
                          {trip.flights.length > 2 && (
                            <p className="text-xs text-muted-foreground pl-1">
                              +{trip.flights.length - 2} more flights
                            </p>
                          )}
                        </div>

                        {/* Pricing Information */}
                        <div className="p-4 pt-0 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Paid:</span>
                            <span className="font-semibold text-foreground">{formatCurrency(trip.paidPrice)}</span>
                          </div>
                          
                          {trip.lastCheckedPrice ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Current:</span>
                                <span className={`font-semibold ${
                                  trip.lastCheckedPrice < trip.paidPrice 
                                    ? 'text-green-600' 
                                    : 'text-foreground'
                                }`}>
                                  {formatCurrency(trip.lastCheckedPrice)}
                                </span>
                              </div>
                              
                              {savings > 0 && (
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="text-sm font-medium text-muted-foreground">Save:</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(savings)}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>Awaiting price check</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 pt-0 space-y-3">
                          {trip.lastCheckedAt && (
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Checked {formatDate(trip.lastCheckedAt)}
                            </p>
                          )}

                          <Link href={`/app/trips/${trip._id}`}>
                            <Button className="w-full" variant="outline" size="sm">
                              View Details
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
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
              <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
              <div className="space-y-2">
                {pastTrips.slice(0, 3).map((trip) => (
                  <Card key={trip._id?.toString()} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/app/trips/${trip._id}`} 
                          className="flex-1 flex items-center space-x-4 hover:opacity-80"
                        >
                          <Archive className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="font-medium text-foreground hover:underline">
                              {trip.tripName}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                              • {trip.flights[0]?.origin} → {trip.flights[0]?.destination}
                            </span>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(trip.flights[0]?.date)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleArchiveTrip(trip._id?.toString() || '', e)}
                            title="Move to history"
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