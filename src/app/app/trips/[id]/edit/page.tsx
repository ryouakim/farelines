'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { 
  ArrowLeft,
  Plus,
  X,
  Link as LinkIcon,
  AlertCircle,
  Plane,
  Save,
  Trash2,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FareType = 'basic_economy' | 'main_cabin' | 'main_plus' | 'main_select' | 'premium_economy' | 'business' | 'first'

type Flight = {
  flightNumber: string
  date: string
  origin: string
  destination: string
  departureTimeLocal?: string
  departureTz?: string
}

type FieldErrors = {
  tripName?: string
  recordLocator?: string
  paidPrice?: string
  flights?: string
  general?: string
}

export default function EditTripPage() {
  const router = useRouter()
  const params = useParams()
  const { status } = useSession()
  
  const [fetchingTrip, setFetchingTrip] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [originalTrip, setOriginalTrip] = useState<any>(null)
  
  // Form data
  const [tripName, setTripName] = useState('')
  const [recordLocator, setRecordLocator] = useState('')
  const [paidPrice, setPaidPrice] = useState('')
  const [fareType, setFareType] = useState<FareType>('main_cabin')
  const [thresholdUsd, setThresholdUsd] = useState('50')
  const [googleFlightsUrl, setGoogleFlightsUrl] = useState('')
  const [paxCount, setPaxCount] = useState(1)
  const [ptc, setPtc] = useState('ADT')
  const [flights, setFlights] = useState<Flight[]>([{
    flightNumber: '',
    date: '',
    origin: '',
    destination: '',
    departureTimeLocal: '',
    departureTz: ''
  }])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && params.id) {
      fetchTrip()
    }
  }, [status, router, params.id])

  const normalizeGoogleFlightsUrl = (url: string) => {
    // Users sometimes copy URLs from HTML where & becomes &amp;.
    // Store/send the raw URL with '&' so Google Flights links work reliably.
    return (url || '').trim().replace(/&amp;/g, '&')
  }

  const fetchTrip = async () => {
    setFetchingTrip(true)
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const trip = data.trip
        setOriginalTrip(trip)
        
        // Populate form with existing data
        setTripName(trip.tripName || '')
        setRecordLocator(trip.recordLocator || '')
        setPaidPrice(trip.paidPrice?.toString() || '')
        setFareType(trip.fareType || 'main_cabin')
        setThresholdUsd(trip.thresholdUsd?.toString() || '50')
        // Back-compat support (API/DB might use different field names)
        setGoogleFlightsUrl(trip.googleFlightsUrl || trip.googleFlightsBookingUrl || trip.googleUrl || '')
        setPaxCount(trip.paxCount || 1)
        setPtc(trip.ptc || 'ADT')
        
        if (trip.flights && trip.flights.length > 0) {
          setFlights(trip.flights.map((f: any) => ({
            flightNumber: f.flightNumber || '',
            date: f.date || '',
            origin: f.origin || '',
            destination: f.destination || '',
            departureTimeLocal: f.departureTimeLocal || '',
            departureTz: f.departureTz || ''
          })))
        }
      } else {
        setErrors({ general: 'Failed to load trip details' })
      }
    } catch (error) {
      setErrors({ general: 'Failed to load trip details' })
    } finally {
      setFetchingTrip(false)
    }
  }

  const validateField = (field: string, value: any) => {
    const newErrors: FieldErrors = { ...errors }
    
    switch(field) {
      case 'tripName':
        if (!value.trim()) {
          newErrors.tripName = 'Trip name is required'
        } else {
          delete newErrors.tripName
        }
        break
      case 'recordLocator':
        if (!value.trim()) {
          newErrors.recordLocator = 'Record locator is required'
        } else if (value.length !== 6) {
          newErrors.recordLocator = 'Record locator must be 6 characters'
        } else {
          delete newErrors.recordLocator
        }
        break
      case 'paidPrice':
        if (!value) {
          newErrors.paidPrice = 'Paid price is required'
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          newErrors.paidPrice = 'Please enter a valid price'
        } else {
          delete newErrors.paidPrice
        }
        break
    }
    
    setErrors(newErrors)
    return newErrors
  }

  const addFlight = () => {
    setFlights([...flights, {
      flightNumber: '',
      date: '',
      origin: '',
      destination: '',
      departureTimeLocal: '',
      departureTz: ''
    }])
  }

  const removeFlight = (index: number) => {
    if (flights.length === 1) return
    setFlights(flights.filter((_, i) => i !== index))
  }

  const updateFlight = (index: number, field: keyof Flight, value: string) => {
    const updatedFlights = [...flights]
    updatedFlights[index] = { ...updatedFlights[index], [field]: value }
    setFlights(updatedFlights)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setErrors({})
    
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/app')
      } else {
        const data = await response.json()
        setErrors({ general: data.error || 'Failed to delete trip' })
      }
    } catch (error) {
      setErrors({ general: 'Failed to delete trip' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    validateField('tripName', tripName)
    validateField('recordLocator', recordLocator)
    validateField('paidPrice', paidPrice)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const normalizedGoogleFlightsUrl = normalizeGoogleFlightsUrl(googleFlightsUrl)

      const payload = {
        tripName,
        recordLocator,
        paxCount,
        ptc,
        paidPrice: parseFloat(paidPrice),
        fareType,
        thresholdUsd: parseFloat(thresholdUsd),
        googleFlightsUrl: normalizedGoogleFlightsUrl || undefined,
        // Back-compat / API variations
        googleFlightsBookingUrl: normalizedGoogleFlightsUrl || undefined,
        googleUrl: normalizedGoogleFlightsUrl || undefined,
        flights: flights.filter(f => f.flightNumber && f.date && f.origin && f.destination)
      }

      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/app/trips/${params.id}`)
      } else {
        setErrors(data.fieldErrors || { general: data.error })
      }
    } catch (error) {
      setErrors({ general: 'Failed to update trip. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetchingTrip) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href={`/app/trips/${params.id}`} className="hover:text-foreground transition-colors">
              {originalTrip?.tripName || 'Trip'}
            </Link>
            <span>/</span>
            <span className="text-foreground">Edit</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm text-muted-foreground">Edit</p>
                  <h1 className="text-2xl font-bold text-foreground">Edit Trip</h1>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">Update your trip information and flight details</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Trip
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Information</CardTitle>
                <CardDescription>Update the basic details of your trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tripName">Trip Name *</Label>
                    <Input
                      id="tripName"
                      value={tripName}
                      onChange={(e) => {
                        setTripName(e.target.value)
                        validateField('tripName', e.target.value)
                      }}
                      placeholder="e.g. Trip to Paris"
                      className={errors.tripName ? 'border-destructive' : ''}
                    />
                    {errors.tripName && (
                      <p className="text-sm text-destructive">{errors.tripName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recordLocator">Record Locator (PNR) *</Label>
                    <div className="relative">
                      <Input
                        id="recordLocator"
                        value={recordLocator}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                          setRecordLocator(value)
                          validateField('recordLocator', value)
                        }}
                        placeholder="ABC123"
                        maxLength={6}
                        className={`pr-14 ${errors.recordLocator ? 'border-destructive' : ''}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {recordLocator.length}/6
                      </div>
                    </div>
                    {errors.recordLocator && (
                      <p className="text-sm text-destructive">{errors.recordLocator}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="googleUrl">
                    Google Flights URL{' '}
                    <span className="text-muted-foreground text-xs ml-2">(Recommended for accurate tracking)</span>
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="googleUrl"
                      placeholder="https://www.google.com/travel/flights/booking?..."
                      value={googleFlightsUrl}
                      onChange={(e) => setGoogleFlightsUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5" />
                    This helps us track the exact fare type and route for accurate price monitoring
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paidPrice">Price Paid *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="paidPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={paidPrice}
                        onChange={(e) => {
                          setPaidPrice(e.target.value)
                          validateField('paidPrice', e.target.value)
                        }}
                        placeholder="0.00"
                        className={`pl-7 ${errors.paidPrice ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total in USD</p>
                    {errors.paidPrice && (
                      <p className="text-sm text-destructive">{errors.paidPrice}</p>
                    )}
                  </div>

                  <div>
                    <Label>Fare Type</Label>
                    <Select value={fareType} onValueChange={(val: FareType) => setFareType(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fare type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic_economy">Basic Economy</SelectItem>
                        <SelectItem value="main_cabin">Main Cabin</SelectItem>
                        <SelectItem value="main_plus">Main Plus</SelectItem>
                        <SelectItem value="main_select">Main Select</SelectItem>
                        <SelectItem value="premium_economy">Premium Economy</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="first">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Passengers</Label>
                    <Input
                      type="number"
                      min="1"
                      value={paxCount}
                      onChange={(e) => setPaxCount(parseInt(e.target.value || '1', 10))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="thresholdUsd">Alert Threshold</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="thresholdUsd"
                        type="number"
                        step="1"
                        min="0"
                        value={thresholdUsd}
                        onChange={(e) => setThresholdUsd(e.target.value)}
                        placeholder="50"
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Min. savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Flight Details
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={addFlight}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Flight
                  </Button>
                </CardTitle>
                <CardDescription>Update all flight segments for this trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {flights.map((flight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Flight {index + 1}</h3>
                      {flights.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFlight(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Flight Number *</Label>
                        <Input
                          value={flight.flightNumber}
                          onChange={(e) => updateFlight(index, 'flightNumber', e.target.value)}
                          placeholder="e.g. AA1234"
                        />
                      </div>

                      <div>
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={flight.date}
                          onChange={(e) => updateFlight(index, 'date', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>From (IATA) *</Label>
                        <Input
                          value={flight.origin}
                          onChange={(e) => updateFlight(index, 'origin', e.target.value.toUpperCase())}
                          placeholder="CLT"
                          maxLength={3}
                        />
                      </div>

                      <div>
                        <Label>To (IATA) *</Label>
                        <Input
                          value={flight.destination}
                          onChange={(e) => updateFlight(index, 'destination', e.target.value.toUpperCase())}
                          placeholder="JFK"
                          maxLength={3}
                        />
                      </div>

                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={flight.departureTimeLocal || ''}
                          onChange={(e) => updateFlight(index, 'departureTimeLocal', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Timezone</Label>
                        <Select
                          value={flight.departureTz || ''}
                          onValueChange={(val) => updateFlight(index, 'departureTz', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                            <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                            <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris/Berlin (CET)</SelectItem>
                            <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                            <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Update Trip'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
