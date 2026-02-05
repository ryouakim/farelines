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
  History,
  Plane,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingDown,
  Archive,
  RefreshCw
} from 'lucide-react'

interface Trip {
  _id: string
  tripName: string
  paidPrice: number
  lastCheckedPrice?: number
  fareType: string
  isArchived?: boolean
  createdAt: string
  flights: Array<{
    origin: string
    destination: string
    date: string
  }>
}

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

export default function HistoryPage() {
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

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </>
    )
  }

  // Get past trips (flights that have already departed)
  const now = new Date()
  const pastTrips = trips.filter(trip => {
    if (!trip.flights || !Array.isArray(trip.flights) || trip.flights.length === 0) {
      return false
    }
    // Check if all flights have passed
    return trip.flights.every(flight => new Date(flight.date) < now)
  })

  // Calculate total savings
  const totalSavings = pastTrips.reduce((acc, trip) => {
    if (trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice) {
      return acc + (trip.paidPrice - trip.lastCheckedPrice)
    }
    return acc
  }, 0)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <History className="h-8 w-8 text-primary-600" />
                Trip History
              </h1>
              <p className="text-muted-foreground">
                View your past trips and track your total savings over time.
              </p>
            </div>
            <Link href="/app">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                View Active Trips
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Past Trips</p>
                    <p className="text-2xl font-bold">{pastTrips.length}</p>
                  </div>
                  <Archive className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Monitored</p>
                    <p className="text-2xl font-bold">{trips.length}</p>
                  </div>
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Past Trips List */}
          <Card>
            <CardHeader>
              <CardTitle>Past Trips</CardTitle>
              <CardDescription>
                Flights that have already departed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastTrips.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past trips yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your completed trips will appear here after your flights depart.
                  </p>
                  <Link href="/app/trips/new">
                    <Button>Add Your First Trip</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastTrips.map((trip) => {
                    const savings = trip.lastCheckedPrice
                      ? trip.paidPrice - trip.lastCheckedPrice
                      : 0

                    return (
                      <div
                        key={trip._id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Plane className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{trip.tripName || 'Unnamed Trip'}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {trip.flights && trip.flights.length > 0 && (
                                <span className="flex items-center gap-1">
                                  {trip.flights[0].origin}
                                  <ChevronRight className="h-3 w-3" />
                                  {trip.flights[trip.flights.length - 1].destination}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {trip.flights?.[0]?.date
                                  ? formatDate(trip.flights[0].date)
                                  : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Paid</div>
                            <div className="font-semibold">{formatCurrency(trip.paidPrice)}</div>
                          </div>

                          {savings > 0 ? (
                            <Badge variant="default" className="bg-green-600">
                              <TrendingDown className="mr-1 h-3 w-3" />
                              Saved {formatCurrency(savings)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              No price drop
                            </Badge>
                          )}

                          <Link href={`/app/trips/${trip._id}`}>
                            <Button variant="ghost" size="sm">
                              View
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
