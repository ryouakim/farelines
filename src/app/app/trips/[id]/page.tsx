'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plane,
  Calendar,
  DollarSign,
  TrendingDown,
  Clock,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Bell
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Trip } from '@/types/trip'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function TripDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingPrice, setCheckingPrice] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && params.id) {
      fetchTrip()
    }
  }, [status, params.id, router])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data.trip)
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckPrice = async () => {
    setCheckingPrice(true)
    try {
      const response = await fetch(`/api/trips/${params.id}/check`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Wait a moment then refresh the trip data
        setTimeout(() => {
          fetchTrip()
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking price:', error)
    } finally {
      setCheckingPrice(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return
    
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/app')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  // Generate price history data for the last 30 days
  const generatePriceHistory = () => {
    if (!trip) return []
    
    const data = []
    const today = new Date()
    const daysToShow = 30
    
    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate price variations (in production, this would come from actual data)
      const basePrice = trip.paidPrice
      const variation = Math.sin(i / 5) * 50 + Math.random() * 30
      const price = Math.max(basePrice - 100, basePrice + variation)
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(price),
        originalPrice: basePrice
      })
    }
    
    // Add actual last checked price if available
    if (trip.lastCheckedPrice) {
      data[data.length - 1].price = trip.lastCheckedPrice
    }
    
    return data
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!trip) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Trip not found</p>
        </div>
      </>
    )
  }

  const priceHistory = generatePriceHistory()
  const savings = trip.lastCheckedPrice && trip.lastCheckedPrice < trip.paidPrice 
    ? trip.paidPrice - trip.lastCheckedPrice 
    : 0

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/app"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{trip.tripName}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>PNR: {trip.recordLocator}</span>
                  {trip.status === 'active' && (
                    <Badge variant="default" className="bg-green-500">
                      Monitoring Active
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCheckPrice}
                  disabled={checkingPrice}
                >
                  {checkingPrice ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Check Price Now
                </Button>
                <Link href={`/app/trips/${trip._id}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Flight Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trip.flights.map((flight, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Plane className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {flight.origin} → {flight.destination}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {flight.flightNumber} • {formatDate(flight.date)}
                            {flight.departureTimeLocal && ` • ${flight.departureTimeLocal}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Price History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price History (Last 30 Days)</CardTitle>
                  <CardDescription>
                    Track how prices have changed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <XAxis dataKey="date" />
                        <YAxis 
                          domain={['dataMin - 50', 'dataMax + 50']}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          formatter={(value: any) => `$${value}`}
                          labelStyle={{ color: '#000' }}
                        />
                        <ReferenceLine 
                          y={trip.paidPrice} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3" 
                          label="Paid Price"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {trip.lastCheckedAt && (
                      <p>Last checked: {formatDate(trip.lastCheckedAt)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Google Flights Link */}
              {trip.googleFlightsUrl && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium mb-1">Google Flights Booking</p>
                        <p className="text-sm text-muted-foreground">
                          View or rebook on Google Flights
                        </p>
                      </div>
                      <a 
                        href={trip.googleFlightsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">
                          Open in Google Flights
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(trip.paidPrice)}</p>
                  </div>
                  
                  {trip.lastCheckedPrice && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className={`text-2xl font-bold ${
                          trip.lastCheckedPrice < trip.paidPrice 
                            ? 'text-green-600' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatCurrency(trip.lastCheckedPrice)}
                        </p>
                      </div>
                      
                      {savings > 0 && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            Potential Savings
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(savings)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Alert Threshold</p>
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(trip.thresholdUsd)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Trip Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Fare Type</p>
                    <Badge variant="secondary">
                      {trip.fareType?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-medium">{trip.paxCount || 1} {trip.ptc || 'ADT'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(trip.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}