'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Plane, 
  TrendingDown, 
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Edit,
  Archive,
  Trash2
} from 'lucide-react'
import { formatCurrency, formatDate, generateTripStatus, getFareTypeDisplay } from '@/lib/utils'
import type { Trip } from '@/types/trip'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeMonitoring: 0,
    totalSavings: 0,
    averageSavings: 0
  })

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
        
        // Calculate stats
        const active = data.trips.filter((t: Trip) => t.status === 'active' && !t.isArchived)
        const savings = data.trips.reduce((total: number, trip: Trip) => {
          if (trip.paidPrice && trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice) {
            return total + (trip.paidPrice - trip.lastCheckedPrice)
          }
          return total
        }, 0)
        
        setStats({
          totalTrips: data.trips.length,
          activeMonitoring: active.length,
          totalSavings: savings,
          averageSavings: data.trips.length > 0 ? savings / data.trips.length : 0
        })
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheck = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/check`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchTrips() // Refresh the list
      }
    } catch (error) {
      console.error('Error checking trip:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Traveler'}!
            </h1>
            <p className="text-muted-foreground">
              Track your flights and never miss a price drop
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrips}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Monitoring</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMonitoring}</div>
                <p className="text-xs text-muted-foreground">Currently tracking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
                <p className="text-xs text-muted-foreground">Potential savings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageSavings)}</div>
                <p className="text-xs text-muted-foreground">Per trip</p>
              </CardContent>
            </Card>
          </div>

          {/* Trips Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Trips</h2>
            <Link href="/app/trips/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Trip
              </Button>
            </Link>
          </div>

          {trips.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                  <Plane className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Add your first trip to start tracking fare prices and saving money on your flights
                </p>
                <Link href="/app/trips/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const status = generateTripStatus(trip)
                const savings = trip.paidPrice && trip.lastCheckedPrice 
                  ? trip.paidPrice - trip.lastCheckedPrice 
                  : 0
                
                return (
                  <Card key={trip._id?.toString()} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{trip.tripName}</CardTitle>
                          <CardDescription className="mt-1">
                            PNR: {trip.recordLocator}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={
                            status.color === 'green' ? 'success' : 
                            status.color === 'red' ? 'destructive' : 
                            status.color === 'yellow' ? 'warning' : 
                            'outline'
                          }
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Flight Details */}
                      <div className="space-y-3 mb-4">
                        {trip.flights.slice(0, 2).map((flight, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <div className="flex items-center flex-1">
                              <span className="font-medium">{flight.origin}</span>
                              <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{flight.destination}</span>
                            </div>
                            <span className="text-muted-foreground">
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

                      {/* Pricing */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid Price:</span>
                          <span className="font-medium">{formatCurrency(trip.paidPrice)}</span>
                        </div>
                        {trip.lastCheckedPrice && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Price:</span>
                            <span className={cn(
                              "font-medium",
                              savings > 0 ? "text-green-600" : savings < 0 ? "text-red-600" : ""
                            )}>
                              {formatCurrency(trip.lastCheckedPrice)}
                            </span>
                          </div>
                        )}
                        {savings > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Potential Savings:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(savings)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fare Type */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">
                          {getFareTypeDisplay(trip.fareType)}
                        </Badge>
                        {trip.lastCheckedAt && (
                          <span className="text-xs text-muted-foreground">
                            Last checked {formatDate(trip.lastCheckedAt)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/app/trips/${trip._id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManualCheck(trip._id?.toString() || '')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
