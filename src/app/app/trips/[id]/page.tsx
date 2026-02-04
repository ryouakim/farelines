'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Plane,
  Calendar,
  MapPin,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  AlertCircle
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

interface TripDetailPageProps {
  params: {
    id: string
  }
}

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [trip, setTrip] = useState<any>(null)
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
    if (!confirm('Are you sure you want to delete this trip?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/app')
      } else {
        alert('Failed to delete trip.')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip.')
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
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32" />
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
                    {formatCurrency(trip.paidPrice || 0)}
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
                    {savings >= 0 ? 'Savings' : 'Increase'}
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
              {trip.lastCheckedAt && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Checked:</span>
                  </div>
                  <div className="text-sm">
                    {formatDateTime(trip.lastCheckedAt)}
                  </div>
                </div>
              )}
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
                  {trip.flights.map((flight: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-lg">{flight.origin || 'XXX'}</span>
                          </div>
                          <span className="text-muted-foreground text-lg">→</span>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-lg">{flight.destination || 'XXX'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {flight.date ? formatDate(flight.date) : 'TBD'}
                          </div>
                          {flight.flightNumber && (
                            <div className="flex items-center gap-1">
                              <Plane className="h-4 w-4" />
                              {flight.flightNumber}
                            </div>
                          )}
                          {flight.departureTimeLocal && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {flight.departureTimeLocal}
                            </div>
                          )}
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

          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
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
                <span className="font-medium">
                  {trip.createdAt ? formatDate(trip.createdAt) : 'Unknown'}
                </span>
              </div>

              {trip.googleFlightsUrl && (
                <div className="pt-4 border-t">
                  <a 
                    href={trip.googleFlightsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
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