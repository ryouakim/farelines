'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  Link as LinkIcon,
  Plane,
  Save,
  Trash2
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
  const isEditMode = params?.id && params.id !== 'new'
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
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
    }
    
    if (isEditMode) {
      fetchTrip()
    }
  }, [status, router, isEditMode])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const trip = data.trip
        
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
          setFlights(trip.flights)
        }
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
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
    const updated = [...flights]
    updated[index] = { ...updated[index], [field]: value }
    setFlights(updated)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/app')
      } else {
        setErrors({ general: 'Failed to delete trip' })
      }
    } catch (error) {
      setErrors({ general: 'Failed to delete trip' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const payload = {
        tripName,
        recordLocator,
        paxCount,
        ptc,
        paidPrice: parseFloat(paidPrice),
        fareType,
        thresholdUsd: parseFloat(thresholdUsd),
        googleFlightsUrl: googleFlightsUrl || undefined,
        flights: flights.filter(f => f.flightNumber && f.date && f.origin && f.destination)
      }

      const url = isEditMode 
        ? `/api/trips/${params.id}`
        : '/api/trips'
      
      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/app')
      } else {
        setErrors(data.fieldErrors || { general: data.error })
      }
    } catch (error) {
      setErrors({ general: 'Failed to save trip. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {isEditMode ? 'Edit Trip' : 'Add New Trip'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? 'Update your trip details' : 'Enter your flight information'}
              </p>
            </div>
            
            {isEditMode && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Trip
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tripName">Trip Name</Label>
                    <Input
                      id="tripName"
                      placeholder="e.g., Summer Vacation 2024"
                      value={tripName}
                      onChange={(e) => setTripName(e.target.value)}
                      required
                    />
                    {errors.tripName && (
                      <p className="text-sm text-red-500 mt-1">{errors.tripName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="pnr">Record Locator (PNR)</Label>
                    <Input
                      id="pnr"
                      placeholder="6-character code"
                      value={recordLocator}
                      onChange={(e) => setRecordLocator(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                    />
                    {errors.recordLocator && (
                      <p className="text-sm text-red-500 mt-1">{errors.recordLocator}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="googleUrl">
                    Google Flights URL 
                    <span className="text-muted-foreground text-xs ml-2">(Optional but recommended)</span>
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
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="paidPrice">Price Paid (USD)</Label>
                    <Input
                      id="paidPrice"
                      type="number"
                      placeholder="499"
                      value={paidPrice}
                      onChange={(e) => setPaidPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fareType">Fare Type</Label>
                    <select
                      id="fareType"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                      value={fareType}
                      onChange={(e) => setFareType(e.target.value as FareType)}
                    >
                      {fareTypes.map(ft => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="passengers">Passengers</Label>
                    <Input
                      id="passengers"
                      type="number"
                      value={paxCount}
                      onChange={(e) => setPaxCount(parseInt(e.target.value) || 1)}
                      min="1"
                      max="9"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="threshold">Alert Threshold ($)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      placeholder="50"
                      value={thresholdUsd}
                      onChange={(e) => setThresholdUsd(e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flight Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Flight Details</CardTitle>
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
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium flex items-center">
                        <Plane className="mr-2 h-4 w-4" />
                        Flight {index + 1}
                      </h4>
                      {flights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFlight(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Flight Number</Label>
                        <Input
                          placeholder="e.g., AA 1234"
                          value={flight.flightNumber}
                          onChange={(e) => updateFlight(index, 'flightNumber', e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={flight.date}
                          onChange={(e) => updateFlight(index, 'date', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <Label>Origin (IATA)</Label>
                        <Input
                          placeholder="JFK"
                          value={flight.origin}
                          onChange={(e) => updateFlight(index, 'origin', e.target.value.toUpperCase())}
                          maxLength={3}
                          required
                        />
                      </div>
                      <div>
                        <Label>Destination (IATA)</Label>
                        <Input
                          placeholder="LAX"
                          value={flight.destination}
                          onChange={(e) => updateFlight(index, 'destination', e.target.value.toUpperCase())}
                          maxLength={3}
                          required
                        />
                      </div>
                      <div>
                        <Label>Departure Time</Label>
                        <Input
                          type="time"
                          value={flight.departureTimeLocal}
                          onChange={(e) => updateFlight(index, 'departureTimeLocal', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Input
                          placeholder="America/New_York"
                          value={flight.departureTz}
                          onChange={(e) => updateFlight(index, 'departureTz', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {errors.general && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : (isEditMode ? 'Update Trip' : 'Create Trip')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
