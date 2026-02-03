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
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react'
import type { FareType, Trip } from '@/types/trip'

const fareTypes: { value: FareType; label: string }[] = [
  { value: 'basic_economy', label: 'Basic Economy' },
  { value: 'main_cabin', label: 'Main Cabin' },
  { value: 'main_plus', label: 'Main Plus' },
  { value: 'main_select', label: 'Main Select' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
]

const timezones = [
  { value: '', label: 'Select timezone...' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris/Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
]

const commonAirlines = [
  { code: '', name: 'Select Airline...' },
  { code: 'AA', name: 'American Airlines (AA)' },
  { code: 'DL', name: 'Delta Air Lines (DL)' },
  { code: 'UA', name: 'United Airlines (UA)' },
  { code: 'WN', name: 'Southwest Airlines (WN)' },
  { code: 'B6', name: 'JetBlue Airways (B6)' },
  { code: 'AS', name: 'Alaska Airlines (AS)' },
  { code: 'NK', name: 'Spirit Airlines (NK)' },
  { code: 'F9', name: 'Frontier Airlines (F9)' },
  { code: 'G4', name: 'Allegiant Air (G4)' },
  { code: 'SY', name: 'Sun Country Airlines (SY)' },
  { code: 'AC', name: 'Air Canada (AC)' },
  { code: 'BA', name: 'British Airways (BA)' },
  { code: 'LH', name: 'Lufthansa (LH)' },
  { code: 'AF', name: 'Air France (AF)' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines (KL)' },
  { code: 'EK', name: 'Emirates (EK)' },
  { code: 'QR', name: 'Qatar Airways (QR)' },
  { code: 'SQ', name: 'Singapore Airlines (SQ)' },
  { code: 'CX', name: 'Cathay Pacific (CX)' },
  { code: 'JL', name: 'Japan Airlines (JL)' },
  { code: 'NH', name: 'All Nippon Airways (NH)' },
  { code: 'QF', name: 'Qantas (QF)' },
  { code: 'EY', name: 'Etihad Airways (EY)' },
  { code: 'TK', name: 'Turkish Airlines (TK)' },
  { code: 'LX', name: 'SWISS (LX)' },
]

interface Flight {
  flightNumber: string
  date: string
  origin: string
  destination: string
  departureTimeLocal?: string
  departureTz?: string
}

export default function EditTripPage() {
  const router = useRouter()
  const params = useParams()
  const { status } = useSession()
  
  const [loading, setLoading] = useState(false)
  const [fetchingTrip, setFetchingTrip] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({})
  const [originalTrip, setOriginalTrip] = useState<Trip | null>(null)
  
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
        setGoogleFlightsUrl(trip.googleFlightsUrl || '')
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
        setErrors({ general: 'Trip not found' })
        router.push('/app')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      setErrors({ general: 'Failed to load trip' })
    } finally {
      setFetchingTrip(false)
    }
  }

  // Validation
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'recordLocator':
        if (value.length !== 6) {
          newErrors.recordLocator = 'PNR must be 6 characters'
        } else {
          delete newErrors.recordLocator
        }
        break
      case 'paidPrice':
        if (!value || parseFloat(value) <= 0) {
          newErrors.paidPrice = 'Price must be greater than 0'
        } else {
          delete newErrors.paidPrice
        }
        break
      case 'tripName':
        if (!value || value.trim().length < 3) {
          newErrors.tripName = 'Trip name must be at least 3 characters'
        } else {
          delete newErrors.tripName
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleFieldChange = (field: string, value: any, validate = true) => {
    setFieldTouched({ ...fieldTouched, [field]: true })
    if (validate && fieldTouched[field]) {
      validateField(field, value)
    }
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
    if (flights.length > 1) {
      setFlights(flights.filter((_, i) => i !== index))
    }
  }

  const updateFlight = (index: number, field: keyof Flight, value: string) => {
    setFlights(flights.map((flight, i) => 
      i === index ? { ...flight, [field]: value } : flight
    ))
  }

  // FIXED: Proper form submission that sends all data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validate required fields
      if (!tripName.trim()) {
        setErrors({ tripName: 'Trip name is required' })
        setLoading(false)
        return
      }
      
      if (!recordLocator || recordLocator.length !== 6) {
        setErrors({ recordLocator: 'PNR must be 6 characters' })
        setLoading(false)
        return
      }
      
      if (!paidPrice || parseFloat(paidPrice) <= 0) {
        setErrors({ paidPrice: 'Price must be greater than 0' })
        setLoading(false)
        return
      }

      // Build the payload with ALL form data
      const payload = {
        tripName: tripName.trim(),
        recordLocator: recordLocator.toUpperCase(),
        paidPrice: parseFloat(paidPrice),
        fareType: fareType,
        thresholdUsd: parseFloat(thresholdUsd) || 50,
        googleFlightsUrl: googleFlightsUrl.trim(), // FIXED: Include Google Flights URL
        flights: flights.filter(f => 
          f.flightNumber && f.date && f.origin && f.destination
        )
      }

      console.log('Submitting payload:', payload) // Debug log

      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log('API response:', result) // Debug log

      if (response.ok) {
        router.push(`/app/trips/${params.id}`)
      } else {
        setErrors({ 
          general: result.error || 'Failed to update trip'
        })
      }
    } catch (error) {
      console.error('Error updating trip:', error)
      setErrors({ general: 'Failed to update trip' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetchingTrip) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
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
          {/* Breadcrumbs */}
          <nav className="text-sm mb-6">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li><Link href="/app" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li><Link href={`/app/trips/${params.id}`} className="text-muted-foreground hover:text-foreground">Trip Details</Link></li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground" /></li>
              <li className="text-foreground font-medium">Edit Trip</li>
            </ol>
          </nav>

          <div className="flex items-center space-x-4 mb-8">
            <Link href={`/app/trips/${params.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Trip</h1>
              <p className="text-muted-foreground">Update your trip details and preferences</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Trip name and booking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trip-name">Trip Name *</Label>
                    <Input
                      id="trip-name"
                      placeholder="Spring Break Miami"
                      value={tripName}
                      onChange={(e) => {
                        setTripName(e.target.value)
                        handleFieldChange('tripName', e.target.value)
                      }}
                      className={errors.tripName ? 'border-destructive' : ''}
                      required
                    />
                    {errors.tripName && (
                      <p className="text-sm text-destructive mt-1">{errors.tripName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pnr">Booking Reference (PNR) *</Label>
                    <Input
                      id="pnr"
                      placeholder="ABC123"
                      value={recordLocator}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        setRecordLocator(value)
                        handleFieldChange('recordLocator', value)
                      }}
                      maxLength={6}
                      className={`font-mono text-center ${errors.recordLocator ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.recordLocator && (
                      <p className="text-sm text-destructive mt-1">{errors.recordLocator}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="google-flights-url" className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Google Flights Booking URL</span>
                  </Label>
                  <Input
                    id="google-flights-url"
                    type="url"
                    placeholder="https://www.google.com/travel/flights/booking?tfs=..."
                    value={googleFlightsUrl}
                    onChange={(e) => setGoogleFlightsUrl(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <Info className="h-3 w-3 inline mr-1" />
                    Copy your booking URL from Google Flights for better price tracking
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Monitoring</CardTitle>
                <CardDescription>Set price tracking preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paid-price">Price Paid *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="paid-price"
                        type="number"
                        placeholder="450"
                        value={paidPrice}
                        onChange={(e) => {
                          setPaidPrice(e.target.value)
                          handleFieldChange('paidPrice', e.target.value)
                        }}
                        className={`pl-8 ${errors.paidPrice ? 'border-destructive' : ''}`}
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    {errors.paidPrice && (
                      <p className="text-sm text-destructive mt-1">{errors.paidPrice}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="fare-type">Fare Type</Label>
                    <select
                      id="fare-type"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                      value={fareType}
                      onChange={(e) => setFareType(e.target.value as FareType)}
                    >
                      {fareTypes.map(fare => (
                        <option key={fare.value} value={fare.value}>
                          {fare.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="threshold">Alert Threshold</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="threshold"
                        type="number"
                        placeholder="50"
                        value={thresholdUsd}
                        onChange={(e) => setThresholdUsd(e.target.value)}
                        className="pl-8"
                        min="1"
                        step="1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Min. savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Flight Details</CardTitle>
                    <CardDescription>Update all flight segments for this trip</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addFlight}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Flight
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {flights.map((flight, index) => (
                  <Card key={index} className="border-muted">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium flex items-center">
                          <Plane className="mr-2 h-4 w-4" />
                          Flight {index + 1}
                        </h4>
                        {flights.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFlight(index)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label>Flight Number *</Label>
                          <div className="flex gap-2">
                            <select
                              className="w-[180px] h-10 px-2 rounded-lg border border-input bg-background text-sm"
                              value={flight.flightNumber.split(' ')[0]}
                              onChange={(e) => {
                                const number = flight.flightNumber.split(' ')[1] || ''
                                updateFlight(index, 'flightNumber', `${e.target.value} ${number}`)
                              }}
                              required
                            >
                              {commonAirlines.map(airline => (
                                <option key={airline.code} value={airline.code}>
                                  {airline.name}
                                </option>
                              ))}
                            </select>
                            <Input
                              placeholder="Flight # (e.g., 1234)"
                              value={flight.flightNumber.split(' ')[1] || ''}
                              onChange={(e) => {
                                const airline = flight.flightNumber.split(' ')[0] || ''
                                updateFlight(index, 'flightNumber', `${airline} ${e.target.value}`)
                              }}
                              required
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={flight.date}
                            onChange={(e) => updateFlight(index, 'date', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label>From (IATA) *</Label>
                          <Input
                            placeholder="CLT"
                            value={flight.origin}
                            onChange={(e) => updateFlight(index, 'origin', e.target.value.toUpperCase())}
                            maxLength={3}
                            required
                            className="text-center font-mono"
                          />
                        </div>
                        <div>
                          <Label>To (IATA) *</Label>
                          <Input
                            placeholder="LAX"
                            value={flight.destination}
                            onChange={(e) => updateFlight(index, 'destination', e.target.value.toUpperCase())}
                            maxLength={3}
                            required
                            className="text-center font-mono"
                          />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={flight.departureTimeLocal}
                            onChange={(e) => updateFlight(index, 'departureTimeLocal', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Timezone</Label>
                          <select
                            className="w-full h-10 px-2 rounded-lg border border-input bg-background text-sm"
                            value={flight.departureTz}
                            onChange={(e) => updateFlight(index, 'departureTz', e.target.value)}
                          >
                            {timezones.map(tz => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {errors.general && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/app/trips/${params.id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Trip
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}