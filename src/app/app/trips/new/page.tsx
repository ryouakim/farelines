'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  Upload,
  Link as LinkIcon,
  AlertCircle,
  Plane,
  Save
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { parseGoogleFlightsUrl } from '@/lib/utils'
import type { FareType } from '@/types/trip'

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

export default function AddTripPage() {
  const router = useRouter()
  const { status } = useSession()
  const [step, setStep] = useState<'method' | 'details'>('method')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data
  const [tripName, setTripName] = useState('')
  const [recordLocator, setRecordLocator] = useState('')
  const [paidPrice, setPaidPrice] = useState('')
  const [fareType, setFareType] = useState<FareType>('main_cabin')
  const [thresholdUsd, setThresholdUsd] = useState('50')
  const [googleFlightsUrl, setGoogleFlightsUrl] = useState('')
  const [flights, setFlights] = useState<Flight[]>([{
    flightNumber: '',
    date: '',
    origin: '',
    destination: '',
    departureTimeLocal: '',
    departureTz: ''
  }])
  const [paxCount, setPaxCount] = useState(1)

  // File upload for PDF
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setLoading(true)
      // In production, this would upload and parse the PDF
      alert('PDF parsing will be implemented with the backend service')
      setLoading(false)
      setStep('details')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleGoogleFlightsUrl = () => {
    if (googleFlightsUrl) {
      try {
        const parsed = parseGoogleFlightsUrl(googleFlightsUrl)
        // Pre-fill what we can from the URL
        if (parsed.legs && parsed.legs.length > 0) {
          const newFlights = parsed.legs.map(leg => ({
            flightNumber: '',
            date: leg.date || '',
            origin: leg.origin || '',
            destination: leg.destination || '',
            departureTimeLocal: '',
            departureTz: ''
          }))
          setFlights(newFlights)
        }
        setStep('details')
      } catch {
        setErrors({ url: 'Invalid Google Flights URL' })
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripName,
          recordLocator,
          paxCount,
          ptc: 'ADT',
          paidPrice: parseFloat(paidPrice),
          fareType,
          thresholdUsd: parseFloat(thresholdUsd),
          googleFlightsUrl: googleFlightsUrl || undefined,
          flights: flights.filter(f => f.flightNumber && f.date && f.origin && f.destination)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/app')
      } else {
        setErrors(data.fieldErrors || { general: data.error })
      }
    } catch {
      setErrors({ general: 'Failed to create trip. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
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

          {step === 'method' ? (
            <>
              <h1 className="text-3xl font-bold mb-2">Add New Trip</h1>
              <p className="text-muted-foreground mb-8">
                Choose how you&apos;d like to add your flight details
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Upload PDF */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <CardHeader className="text-center">
                      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20 mx-auto">
                        <Upload className="h-7 w-7 text-primary-600" />
                      </div>
                      <CardTitle className="text-lg">Upload PDF</CardTitle>
                      <CardDescription>
                        {isDragActive ? 'Drop the PDF here' : 'Drag & drop or click to upload your confirmation PDF'}
                      </CardDescription>
                    </CardHeader>
                  </div>
                </Card>

                {/* Google Flights URL */}
                <Card>
                  <CardHeader className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20 mx-auto">
                      <LinkIcon className="h-7 w-7 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">Google Flights URL</CardTitle>
                    <CardDescription>
                      Paste your Google Flights booking URL
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="https://www.google.com/travel/flights..."
                      value={googleFlightsUrl}
                      onChange={(e) => setGoogleFlightsUrl(e.target.value)}
                      className="mb-3"
                    />
                    <Button 
                      onClick={handleGoogleFlightsUrl} 
                      className="w-full"
                      disabled={!googleFlightsUrl}
                    >
                      Continue
                    </Button>
                  </CardContent>
                </Card>

                {/* Manual Entry */}
                <Card>
                  <CardHeader className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20 mx-auto">
                      <Plane className="h-7 w-7 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">Manual Entry</CardTitle>
                    <CardDescription>
                      Enter your flight details manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setStep('details')} 
                      className="w-full"
                      variant="outline"
                    >
                      Enter Manually
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">Trip Details</h1>
              <p className="text-muted-foreground mb-8">
                Enter your flight information and preferences
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
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

                    {/* Google Flights URL Field - Now in Manual Entry Too */}
                    <div>
                      <Label htmlFor="googleUrl">
                        Google Flights URL 
                        <span className="text-muted-foreground text-xs ml-2">(Optional but recommended for price tracking)</span>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps us track the exact fare type and route for accurate price monitoring
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
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
                        <Label htmlFor="threshold">Alert Threshold (USD)</Label>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="passengers">Number of Passengers</Label>
                        <Input
                          id="passengers"
                          type="number"
                          value={paxCount}
                          onChange={(e) => setPaxCount(parseInt(e.target.value) || 1)}
                          min="1"
                          max="9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                    {loading ? 'Creating...' : 'Create Trip'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}