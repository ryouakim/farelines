'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  ArrowRight,
  Edit,
  Save,
  X,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Plane,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Archive,
  Trash2
} from 'lucide-react'
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  generateTripStatus, 
  getFareTypeDisplay,
  calculateSavings 
} from '@/lib/utils'
import type { Trip, FareType } from '@/types/trip'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function TripDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  
  // Edit form state
  const [editData, setEditData] = useState({
    tripName: '',
    paidPrice: '',
    fareType: '' as FareType,
    thresholdUsd: '',
  })

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
        setEditData({
          tripName: data.trip.tripName,
          paidPrice: data.trip.paidPrice.toString(),
          fareType: data.trip.fareType,
          thresholdUsd: data.trip.thresholdUsd.toString(),
        })
      } else if (response.status === 404) {
        router.push('/app')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      const response = await fetch(`/api/trips/${params.id}/check`, {
        method: 'POST',
      })
      if (response.ok) {
        setTimeout(fetchTrip, 2000) // Refresh after a short delay
      }
    } catch (error) {
      console.error('Error checking trip:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripName: editData.tripName,
          paidPrice: parseFloat(editData.paidPrice),
          fareType: editData.fareType,
          thresholdUsd: parseFloat(editData.thresholdUsd),
        }),
      })
      
      if (response.ok) {
        setEditing(false)
        fetchTrip()
      }
    } catch (error) {
      console.error('Error saving trip:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this trip?')) {
      try {
        const response = await fetch(`/api/trips/${params.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          router.push('/app')
        }
      } catch (error) {
        console.error('Error archiving trip:', error)
      }
    }
  }

  const handlePause = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: trip?.status === 'paused' ? 'active' : 'paused',
        }),
      })
      
      if (response.ok) {
        fetchTrip()
      }
    } catch (error) {
      console.error('Error updating trip status:', error)
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
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!trip) {
    return null
  }

  const tripStatus = generateTripStatus(trip)
  const savings = calculateSavings(trip.paidPrice, trip.lastCheckedPrice || trip.paidPrice)
  
  // Prepare chart data (mock for now - would come from price history)
  const chartData = [
    { date: 'Jan 1', price: trip.paidPrice },
    { date: 'Jan 5', price: trip.paidPrice - 20 },
    { date: 'Jan 10', price: trip.paidPrice - 50 },
    { date: 'Jan 15', price: trip.lastCheckedPrice || trip.paidPrice },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Trip Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editData.tripName}
                    onChange={(e) => setEditData({ ...editData, tripName: e.target.value })}
                    className="text-3xl font-bold"
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-bold">{trip.tripName}</h1>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline">PNR: {trip.recordLocator}</Badge>
                <Badge 
                  variant={
                    tripStatus.color === 'green' ? 'success' : 
                    tripStatus.color === 'red' ? 'destructive' : 
                    tripStatus.color === 'yellow' ? 'warning' : 
                    'outline'
                  }
                >
                  {tripStatus.label}
                </Badge>
                <Badge variant="outline">
                  {getFareTypeDisplay(trip.fareType)}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false)
                      setEditData({
                        tripName: trip.tripName,
                        paidPrice: trip.paidPrice.toString(),
                        fareType: trip.fareType,
                        thresholdUsd: trip.thresholdUsd.toString(),
                      })
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleManualCheck}
                    disabled={checking}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", checking && "animate-spin")} />
                    {checking ? 'Checking...' : 'Check Price'}
                  </Button>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="sm"
                  >
                    {trip.status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleArchive}
                    variant="outline"
                    size="sm"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Paid Price</Label>
                      {editing ? (
                        <Input
                          type="number"
                          value={editData.paidPrice}
                          onChange={(e) => setEditData({ ...editData, paidPrice: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-2xl font-bold">{formatCurrency(trip.paidPrice)}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Price</Label>
                      <p className={cn(
                        "text-2xl font-bold",
                        savings.amount > 0 ? "text-green-600" : savings.amount < 0 ? "text-red-600" : ""
                      )}>
                        {formatCurrency(trip.lastCheckedPrice || trip.paidPrice)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Potential Savings</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {savings.amount > 0 ? formatCurrency(savings.amount) : '-'}
                      </p>
                      {savings.percentage > 0 && (
                        <p className="text-sm text-green-600">
                          Save {savings.percentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alert Threshold */}
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground">Alert Threshold</Label>
                    {editing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span>Alert when savings exceed $</span>
                        <Input
                          type="number"
                          value={editData.thresholdUsd}
                          onChange={(e) => setEditData({ ...editData, thresholdUsd: e.target.value })}
                          className="w-24"
                        />
                      </div>
                    ) : (
                      <p className="text-sm mt-1">
                        Alert when savings exceed {formatCurrency(trip.thresholdUsd)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Price History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price History</CardTitle>
                  <CardDescription>
                    Track how your fare has changed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <ReferenceLine 
                          y={trip.paidPrice} 
                          stroke="red" 
                          strokeDasharray="5 5"
                          label="Paid Price"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#0891b2" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Flight Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trip.flights.map((flight, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            <Plane className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{flight.flightNumber}</span>
                            <Badge variant="outline" className="text-xs">
                              {flight.airline}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <span>{flight.origin}</span>
                            <ArrowRight className="mx-2 h-4 w-4" />
                            <span>{flight.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDate(flight.date)}</p>
                        {flight.departureTimeLocal && (
                          <p className="text-sm text-muted-foreground">
                            Departs {flight.departureTimeLocal}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trip.googleFlightsUrl && (
                    <Button
                      onClick={() => window.open(trip.googleFlightsUrl, '_blank')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Google Flights
                    </Button>
                  )}
                  <Button
                    onClick={() => window.open(`https://www.google.com/flights?hl=en#search;f=${trip.flights[0]?.origin};t=${trip.flights[0]?.destination};d=${trip.flights[0]?.date}`, '_blank')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Search Similar Flights
                  </Button>
                </CardContent>
              </Card>

              {/* Trip Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trip Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Passengers</Label>
                    <p className="font-medium">{trip.paxCount} {trip.ptc === 'ADT' ? 'Adult(s)' : 'Passenger(s)'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Fare Type</Label>
                    {editing ? (
                      <select
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                        value={editData.fareType}
                        onChange={(e) => setEditData({ ...editData, fareType: e.target.value as FareType })}
                      >
                        <option value="basic_economy">Basic Economy</option>
                        <option value="main_cabin">Main Cabin</option>
                        <option value="main_plus">Main Plus</option>
                        <option value="main_select">Main Select</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    ) : (
                      <p className="font-medium">{getFareTypeDisplay(trip.fareType)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Created</Label>
                    <p className="font-medium">{formatDate(trip.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Last Checked</Label>
                    <p className="font-medium">
                      {trip.lastCheckedAt ? formatDateTime(trip.lastCheckedAt) : 'Not checked yet'}
                    </p>
                  </div>
                  {trip.lowestSeen && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Lowest Price Seen</Label>
                      <p className="font-medium text-green-600">{formatCurrency(trip.lowestSeen)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {trip.lastCheckAlerts && trip.lastCheckAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {trip.lastCheckAlerts.slice(0, 3).map((alert: any, index: number) => (
                        <div key={index} className="text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Price dropped to {formatCurrency(alert.price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            {formatDateTime(alert.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No alerts yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
