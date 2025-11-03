'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Bell,
  ChevronRight,
  Download,
  FileText,
  Users
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

  const exportTrip = () => {
    if (!trip) return
    
    const data = {
      tripName: trip.tripName,
      recordLocator: trip.recordLocator,
      flights: trip.flights,
      paidPrice: trip.paidPrice,
      fareType: trip.fareType,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trip-${trip.recordLocator}-${Date.now()}.json`
    a.click()
  }

  // Generate price history data for the last 30 days
  const generatePriceHistory = () => {
    if (!trip) return []
    
    const data = []
    const today = new Date()
    const daysToShow = 30
    
    // This would come from actual historical data in production
    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate price variations (replace with actual data)
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
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
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">Trip not found</p>
              <Link href="/app">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="text-sm mb-6">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li><Link href="/app" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li className="text-foreground font-medium">Trip Details</li>
            </ol>
          </nav>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{trip.tripName}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">PNR: <span className="font-mono font-medium text-foreground">{trip.recordLocator}</span></span>
                  {trip.status === 'active' && (
                    <Badge variant="default" className="bg-green-500 text-white">
                      <Clock className="mr-1 h-3 w-3" />
                      Monitoring Active
                    </Badge>
                  )}
                  {trip.paxCount && trip.paxCount > 1 && (
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      {trip.paxCount} Passengers
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTrip}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckPrice}
                  disabled={checkingPrice}
                >
                  {checkingPrice ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Check Price
                </Button>
                <Link href={`/app/trips/${trip._id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Flight Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip.flights.map((flight, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Plane className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-foreground">
                            {flight.origin} → {flight.destination}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="font-medium">{flight.flightNumber}</span>
                            <span>•</span>
                            <span>{formatDate(flight.date)}</span>
                            {flight.departureTimeLocal && (
                              <>
                                <span>•</span>
                                <span>{flight.departureTimeLocal}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-2 sm:mt-0">
                        Flight {idx + 1}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Price History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price History</CardTitle>
                  <CardDescription>
                    Last 30 days price trend
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          domain={['dataMin - 50', 'dataMax + 50']}
                          tickFormatter={(value) => `$${value}`}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          formatter={(value: any) => `$${value}`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <ReferenceLine 
                          y={trip.paidPrice} 
                          stroke="hsl(var(--destructive))" 
                          strokeDasharray="3 3" 
                          label={{ value: "Paid Price", position: "left", fontSize: 12 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {trip.lastCheckedAt && (
                    <p className="text-sm text-muted-foreground mt-4 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last checked: {formatDate(trip.lastCheckedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Google Flights Link */}
              {trip.googleFlightsUrl && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Google Flights Booking</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            View or rebook this trip on Google Flights
                          </p>
                        </div>
                      </div>
                      <a 
                        href={trip.googleFlightsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          Open in Google Flights
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes Section (Future Feature) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Trip notes will be available in a future update
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Price</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(trip.paidPrice)}</p>
                  </div>
                  
                  {trip.lastCheckedPrice && (
                    <>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className={`text-2xl font-bold ${
                          trip.lastCheckedPrice < trip.paidPrice 
                            ? 'text-green-600' 
                            : 'text-foreground'
                        }`}>
                          {formatCurrency(trip.lastCheckedPrice)}
                        </p>
                      </div>
                      
                      {savings > 0 && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              Potential Savings
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(savings)}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            {Math.round((savings / trip.paidPrice) * 100)}% off original price
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Alert Threshold</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatCurrency(trip.thresholdUsd)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Trip Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fare Type</span>
                    <Badge variant="secondary">
                      {trip.fareType?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'}
                    </Badge>
                  </div>
                  
                  {trip.paxCount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Passengers</span>
                      <span className="font-medium text-foreground">
                        {trip.paxCount} {trip.ptc || 'ADT'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                      {trip.status === 'active' ? 'Monitoring' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm text-foreground">{formatDate(trip.createdAt)}</span>
                    </div>
                  </div>
                  
                  {trip.updatedAt && trip.updatedAt !== trip.createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Updated</span>
                      <span className="text-sm text-foreground">{formatDate(trip.updatedAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/app/trips/${trip._id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Trip Details
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    size="sm"
                    onClick={handleCheckPrice}
                    disabled={checkingPrice}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${checkingPrice ? 'animate-spin' : ''}`} />
                    Check Current Price
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    size="sm"
                    onClick={exportTrip}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Trip Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}