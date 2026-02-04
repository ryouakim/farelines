use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Plane,
  Calendar,
  MapPin,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink
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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

interface Flight {
  flightNumber: string
  date: string
  origin: string
  destination: string
  departureTimeLocal?: string
  carrier?: string
}

interface Trip {
  _id: string
  tripName: string
  paidPrice: number
  fareType: string
  recordLocator?: string
  googleFlightsUrl?: string
  lastCheckedPrice?: number
  lastCheckedAt?: string
  lowestSeen?: number
  flights: Flight[]
  createdAt: string
  updatedAt: string
  thresholdUsd?: number
}

interface TripDetailPageProps {
  params: {
    id: string
  }
}

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchTrip()
    }
  }, [status, params.id, router])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data.trip)
      } else if (response.status === 404) {
        router.push('/app')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/app')
      } else {
        alert('Failed to delete trip. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-24" />
                <Skeleton className="h-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!trip) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/app">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trip Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The trip you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/app">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const savings = trip.lastCheckedPrice ? trip.paidPrice - trip.lastCheckedPrice : 0
  const savingsPercent = trip.lastCheckedPrice ? ((savings / trip.paidPrice) * 100) : 0

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation */}
          <Link href="/app">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Trip Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {trip.tripName || 'Unnamed Trip'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {trip.fareType?.replace(/_/g, ' ') || 'Standard'}
                    </Badge>
                    {trip.recordLocator && (
                      <Badge variant="outline">
                        {trip.recordLocator}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/app/trips/${params.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Price Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm text-muted-foreground mb-1">Paid Price</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(trip.paidPrice)}
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {trip.lastCheckedPrice ? formatCurrency(trip.lastCheckedPrice) : 'Checking...'}
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-sm text-muted-foreground mb-1">
                    {savings >= 0 ? 'Potential Savings' : 'Price Increase'}
                  </div>
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    savings >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {savings >= 0 ? (
                      <TrendingDown className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                    {formatCurrency(Math.abs(savings))}
                  </div>
                  {savings !== 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.abs(savingsPercent).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Last Check Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                </div>
                <div className="text-sm">
                  {trip.lastCheckedAt ? (
                    formatDateTime(trip.lastCheckedAt)
                  ) : (
                    'Never checked'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flight Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.flights && trip.flights.length > 0 ? (
                <div className="space-y-4">
                  {trip.flights.map((flight, index) => (
                    <div key={index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{flight.origin}</span>
                            </div>
                            <span className="text-muted-foreground">→</span>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{flight.destination}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(flight.date)}
                            </div>
                            {flight.flightNumber && (
                              <div className="flex items-center gap-1">
                                <Plane className="h-3 w-3" />
                                {flight.flightNumber}
                              </div>
                            )}
                            {flight.departureTimeLocal && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {flight.departureTimeLocal}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No flight details available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.thresholdUsd && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alert Threshold</span>
                  <span className="font-medium">{formatCurrency(trip.thresholdUsd)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(trip.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="font-medium">{formatDate(trip.updatedAt)}</span>
              </div>

              {trip.googleFlightsUrl && (
                <div className="pt-4 border-t">
                  <a 
                    href={trip.googleFlightsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Google Flights
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
EOF

# 2. Create the monitoring card component
mkdir -p src/components/dashboard
# (Copy the price-monitoring-card.tsx from our previous files)

# 3. Update the main dashboard page
cp src/app/app/page.tsx src/app/app/page.tsx.backup
cat > src/app/app/page.tsx << 'EOF'
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PriceMonitoringCard } from '@/components/dashboard/price-monitoring-card'
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

          {/* Price Monitoring Card */}
          <div className="mb-8">
            <PriceMonitoringCard />
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