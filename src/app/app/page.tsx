'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus,
  Plane,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Trash2
} from 'lucide-react'

// Local utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

interface Trip {
  _id: string
  tripName: string
  paidPrice: number
  lastCheckedPrice?: number
  fareType: string
  isArchived?: boolean
  flights: Array<{
    origin: string
    destination: string
    date: string
  }>
}

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

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
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

  // Filter active trips
  const now = new Date()
  const activeTrips = trips.filter(trip => {
    if (trip.isArchived) return false
    if (!trip.flights || !Array.isArray(trip.flights)) return false
    return trip.flights.some(flight => new Date(flight.date) > now)
  })

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your flights and save money on rebookings
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold">{trips.length}</p>
                  </div>
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{activeTrips.length}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold text-green-600">Active</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trips */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                Active Trips ({activeTrips.length})
              </h2>
              <Link href="/app/trips/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trip
                </Button>
              </Link>
            </div>

            {activeTrips.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Plane className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active trips</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first trip to start monitoring flight prices
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTrips.map((trip) => (
                  <Card key={trip._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg truncate">
                            {trip.tripName || 'Unnamed Trip'}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleDeleteTrip(trip._id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {trip.fareType?.replace(/_/g, ' ') || 'Standard'}
                        </Badge>
                      </div>

                      <div className="p-4">
                        {trip.flights && trip.flights.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {trip.flights.slice(0, 2).map((flight, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                  <span className="font-medium">{flight.origin || 'XXX'}</span>
                                  <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                                  <span className="font-medium">{flight.destination || 'XXX'}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {flight.date ? formatDate(flight.date) : 'TBD'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Paid:</span>
                            <span className="font-semibold">
                              {formatCurrency(trip.paidPrice || 0)}
                            </span>
                          </div>
                          
                          {trip.lastCheckedPrice ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Current:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(trip.lastCheckedPrice)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>Awaiting price check</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <Link href={`/app/trips/${trip._id}`}>
                            <Button className="w-full" variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
