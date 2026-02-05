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
  Trash2,
  Edit,
  Eye
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
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Track your flights and save money on rebookings
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{trips.length}</p>
                  </div>
                  <Plane className="h-8 w-8 text-sky-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTrips.length}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-sky-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monitoring</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">Active</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trips */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
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
              <Card className="text-center py-12 dark:bg-slate-800 dark:border-slate-700">
                <CardContent>
                  <Plane className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No active trips</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
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
                  <Card key={trip._id} className="hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-0">
                      <div className="p-4 border-b dark:border-slate-700">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">
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
                        <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-gray-200">
                          {trip.fareType?.replace(/_/g, ' ') || 'Standard'}
                        </Badge>
                      </div>

                      <div className="p-4">
                        {trip.flights && trip.flights.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {trip.flights.slice(0, 2).map((flight, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                  <span className="font-medium text-gray-900 dark:text-white">{flight.origin || 'XXX'}</span>
                                  <ChevronRight className="h-3 w-3 mx-1 text-gray-400" />
                                  <span className="font-medium text-gray-900 dark:text-white">{flight.destination || 'XXX'}</span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {flight.date ? formatDate(flight.date) : 'TBD'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Paid:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(trip.paidPrice || 0)}
                            </span>
                          </div>

                          {trip.lastCheckedPrice ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Current:</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(trip.lastCheckedPrice)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>Awaiting price check</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link href={`/app/trips/${trip._id}`} className="flex-1">
                            <Button className="w-full dark:border-slate-600 dark:hover:bg-slate-700" variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/app/trips/${trip._id}/edit`} className="flex-1">
                            <Button className="w-full dark:border-slate-600 dark:hover:bg-slate-700" variant="outline" size="sm">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
