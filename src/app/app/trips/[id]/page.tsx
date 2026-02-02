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
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Trip = {
  _id: string
  tripName: string
  recordLocator: string
  status: 'monitoring' | 'archived' | 'completed'
  fareType: string
  paxCount: number
  ptc: string
  paidPrice: number
  thresholdUsd: number
  currentPrice?: number
  lastCheckedAt?: string
  googleFlightsUrl?: string
  // other possible historical/alternate fields may exist on the object
  flights: Array<{
    flightNumber: string
    date: string
    origin: string
    destination: string
    departureTimeLocal?: string
  }>
  createdAt: string
  updatedAt: string
}

export default function TripDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { status } = useSession()
  
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingPrice, setCheckingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && params.id) {
      fetchTrip()
    }
  }, [status, router, params.id])

  const fetchTrip = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setTrip(data.trip)
      } else {
        setError(data.error || 'Failed to load trip')
      }
    } catch (err) {
      setError('Failed to load trip')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/trips/${params.id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/app')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete trip')
      }
    } catch (err) {
      setError('Failed to delete trip')
    }
  }

  const handleCheckPrice = async () => {
    setCheckingPrice(true)
    setError(null)
    try {
      const response = await fetch(`/api/trips/${params.id}/check`, { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        await fetchTrip()
      } else {
        setError(data.error || 'Failed to check price')
      }
    } catch (err) {
      setError('Failed to check price')
    } finally {
      setCheckingPrice(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    return timeStr
  }

  const getStatusBadge = () => {
    if (!trip) return null
    switch (trip.status) {
      case 'monitoring':
        return <Badge>Monitoring Active</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return null
    }
  }

  const googleFlightsUrl = trip?.googleFlightsUrl || (trip as any)?.googleFlightsBookingUrl || (trip as any)?.googleUrl
  const normalizedGoogleFlightsUrl = (googleFlightsUrl || '').toString().replace(/&amp;/g, '&')

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </>
    )
  }

  if (!trip) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/app')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Trip not found'}</AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Breadcrumb / Back */}
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/app')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-muted-foreground">Trip Details</p>
              <h1 className="text-2xl font-bold text-foreground">{trip.tripName}</h1>
              <p className="text-muted-foreground mt-1">
                PNR: <span className="font-medium text-foreground">{trip.recordLocator}</span>
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {getStatusBadge()}
                <Badge variant="secondary">{trip.paxCount} Passengers</Badge>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => { /* keep existing export wiring if any */ }}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleCheckPrice} disabled={checkingPrice}>
                <Clock className="mr-2 h-4 w-4" />
                {checkingPrice ? 'Checking...' : 'Check Price'}
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

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            {/* Flight Details */}
            <Card>
              <CardHeader>
                <CardTitle>Flight Details</CardTitle>
                <CardDescription>Your flight segments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.flights?.map((f, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      {f.origin} → {f.destination}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      <span>{f.flightNumber}</span>
                      <span>•</span>
                      <span>{formatDate(f.date)}</span>
                      {f.departureTimeLocal && (
                        <>
                          <span>•</span>
                          <span>{formatTime(f.departureTimeLocal)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Google Flights Link */}
            {normalizedGoogleFlightsUrl && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
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
                      href={normalizedGoogleFlightsUrl}
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

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Paid Price</p>
                  <p className="text-xl font-semibold">${trip.paidPrice?.toLocaleString?.() ?? trip.paidPrice}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Alert Threshold</p>
                  <p className="text-xl font-semibold">${trip.thresholdUsd?.toLocaleString?.() ?? trip.thresholdUsd}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Fare Type</p>
                  <p className="text-xl font-semibold">{trip.fareType}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="text-xl font-semibold">{trip.paxCount} {trip.ptc}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
