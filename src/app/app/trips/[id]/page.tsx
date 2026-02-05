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
import { PriceHistoryChart } from '@/components/trips/price-history-chart'

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
          <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2 text-gray-900 dark:text-white">
                    {trip.tripName || 'Unnamed Trip'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="dark:bg-slate-700 dark:text-gray-200">
                      {trip.fareType?.replace(/_/g, ' ') || 'Standard'}
                    </Badge>
                    {trip.recordLocator && (
                      <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-200">
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
                <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Paid Price</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(trip.paidPrice || 0)}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <div className="text-sm text-gray-600 dark:text-green-300 mb-1">Current Price</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {trip.lastCheckedPrice ? formatCurrency(trip.lastCheckedPrice) : 'Checking...'}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-sky-50 dark:bg-sky-900/30">
                  <div className="text-sm text-gray-600 dark:text-sky-300 mb-1">
                    {savings >= 0 ? 'Savings' : 'Increase'}
                  </div>
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    savings >= 0 ? 'text-sky-700 dark:text-sky-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {savings >= 0 ? (
                      <TrendingDown className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                    {formatCurrency(Math.abs(savings))}
                  </div>
                  {savings !== 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Math.abs(savingsPercent).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Last Check Status */}
              {trip.lastCheckedAt && (
                <div className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Last Checked:</span>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(trip.lastCheckedAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flight Details */}
          <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Plane className="h-5 w-5 text-sky-500" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.flights && trip.flights.length > 0 ? (
                <div className="space-y-4">
                  {trip.flights.map((flight: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-500" />
                            <span className="font-medium text-lg text-gray-900 dark:text-white">{flight.origin || 'XXX'}</span>
                          </div>
                          <span className="text-gray-400 dark:text-gray-500 text-lg">→</span>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-500" />
                            <span className="font-medium text-lg text-gray-900 dark:text-white">{flight.destination || 'XXX'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {flight.date ? formatDate(flight.date) : 'TBD'}
                          </div>
                          {flight.flightNumber && (
                            <div className="flex items-center gap-1">
                              <Plane className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              {flight.flightNumber}
                            </div>
                          )}
                          {flight.departureTimeLocal && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              {flight.departureTimeLocal}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No flight details available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price History Chart */}
          {trip.priceHistory && trip.priceHistory.length > 0 && (
            <div className="mb-6">
              <PriceHistoryChart
                priceHistory={trip.priceHistory}
                paidPrice={trip.paidPrice}
                currentPrice={trip.lastCheckedPrice}
                lowestSeen={trip.lowestSeenPrice}
              />
            </div>
          )}

          {/* Trip Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.thresholdUsd && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Alert Threshold</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(trip.thresholdUsd)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Created</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {trip.createdAt ? formatDate(trip.createdAt) : 'Unknown'}
                </span>
              </div>

              {trip.googleFlightsUrl && (
                <div className="pt-4 border-t dark:border-slate-600">
                  <a
                    href={trip.googleFlightsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
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