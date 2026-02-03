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
  Save,
  CheckCircle2,
  Clock,
  Info,
  Star
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { parseGoogleFlightsUrl } from '@/lib/utils'
import type { FareType } from '@/types/trip'

const fareTypes: { value: FareType; label: string; description: string }[] = [
  { value: 'basic_economy', label: 'Basic Economy', description: 'No seat selection, last to board' },
  { value: 'main_cabin', label: 'Main Cabin', description: 'Standard economy with seat selection' },
  { value: 'main_plus', label: 'Main Plus', description: 'Extra legroom and priority boarding' },
  { value: 'main_select', label: 'Main Select', description: 'Premium economy features' },
  { value: 'premium_economy', label: 'Premium Economy', description: 'Enhanced comfort and service' },
  { value: 'business', label: 'Business Class', description: 'Lie-flat seats, premium meals' },
  { value: 'first', label: 'First Class', description: 'Luxury amenities and service' },
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

  // Validation functions for better UX
  const validateFlightNumber = (airline: string, number: string) => {
    if (!airline || !number) return { valid: false, message: 'Both airline and number required' }
    if (!/^\d{1,4}$/.test(number)) return { valid: false, message: 'Flight number must be 1-4 digits' }
    return { valid: true, message: '' }
  }

  const validateAirportCode = (code: string) => {
    if (!code) return { valid: false, message: 'Airport code required' }
    if (!/^[A-Z]{3}$/.test(code.toUpperCase())) return { valid: false, message: 'Must be 3 letters (e.g., LAX)' }
    return { valid: true, message: '' }
  }

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
      // Enhanced validation
      if (!tripName.trim()) {
        setErrors({ tripName: 'Trip name is required' })
        setLoading(false)
        return
      }

      if (!paidPrice || parseFloat(paidPrice) <= 0) {
        setErrors({ paidPrice: 'Valid price is required' })
        setLoading(false)
        return
      }

      // Validate all flights
      for (let i = 0; i < flights.length; i++) {
        const flight = flights[i]
        const airline = flight.flightNumber.split(' ')[0]
        const number = flight.flightNumber.split(' ')[1]
        
        const flightValidation = validateFlightNumber(airline, number)
        const originValidation = validateAirportCode(flight.origin)
        const destValidation = validateAirportCode(flight.destination)

        if (!flightValidation.valid) {
          setErrors({ [`flight_${i}`]: `Flight ${i + 1}: ${flightValidation.message}` })
          setLoading(false)
          return
        }

        if (!originValidation.valid) {
          setErrors({ [`flight_${i}`]: `Flight ${i + 1}: Origin ${originValidation.message}` })
          setLoading(false)
          return
        }

        if (!destValidation.valid) {
          setErrors({ [`flight_${i}`]: `Flight ${i + 1}: Destination ${destValidation.message}` })
          setLoading(false)
          return
        }

        if (!flight.date) {
          setErrors({ [`flight_${i}`]: `Flight ${i + 1}: Date is required` })
          setLoading(false)
          return
        }
      }

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
        router.push(`/app/trips/${data.id}`)
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => step === 'details' ? setStep('method') : router.push('/app')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Add New Trip</h1>
              <p className="text-muted-foreground">
                {step === 'method' 
                  ? 'Choose your preferred method to add flight details'
                  : 'Enter your flight information for price monitoring'
                }
              </p>
            </div>
          </div>

          {step === 'method' && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* RECOMMENDED: Flight Number Entry */}
              <Card className="relative border-2 border-primary bg-primary/5">
                <div className="absolute -top-3 left-4">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Recommended</span>
                  </div>
                </div>
                
                <CardHeader className="text-center pt-8">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full">
                    <Plane className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Flight Number Entry</CardTitle>
                  <CardDescription className="text-center">
                    Most reliable method - enter flight numbers directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Works with all airlines & booking sites</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Never expires or goes stale</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Fastest & most accurate setup</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setStep('details')}
                  >
                    Enter Flight Details
                  </Button>
                </CardContent>
              </Card>

              {/* Google Flights URL */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-muted rounded-full">
                    <LinkIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">Google Flights URL</CardTitle>
                  <CardDescription className="text-center">
                    Import from Google Flights booking URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>URLs may expire over time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Limited to Google Flights bookings</span>
                    </div>
                  </div>
                  <Input
                    placeholder="https://www.google.com/travel/flights/booking?..."
                    value={googleFlightsUrl}
                    onChange={(e) => setGoogleFlightsUrl(e.target.value)}
                    className="text-xs font-mono"
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive">{errors.url}</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleFlightsUrl}
                    disabled={!googleFlightsUrl.trim()}
                  >
                    Continue with URL
                  </Button>
                </CardContent>
              </Card>

              {/* PDF Upload - Future */}
              <Card className="hover:shadow-md transition-shadow opacity-60">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-muted rounded-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">Upload PDF</CardTitle>
                  <CardDescription className="text-center">
                    Upload confirmation email or PDF (coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-not-allowed opacity-50 ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <input {...getInputProps()} disabled />
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      AI-powered extraction from booking confirmations
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Trip Information</CardTitle>
                  <CardDescription>Basic details about your trip and booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tripName">Trip Name *</Label>
                      <Input
                        id="tripName"
                        placeholder="e.g., Spring Break Miami"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className={errors.tripName ? 'border-destructive' : ''}
                        required
                      />
                      {errors.tripName && (
                        <p className="text-sm text-destructive mt-1">{errors.tripName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recordLocator">Record Locator (PNR)</Label>
                      <Input
                        id="recordLocator"
                        placeholder="6-character code (optional)"
                        value={recordLocator}
                        onChange={(e) => setRecordLocator(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="paidPrice">Price Paid (USD) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="paidPrice"
                          type="number"
                          placeholder="499"
                          value={paidPrice}
                          onChange={(e) => setPaidPrice(e.target.value)}
                          className={`pl-8 ${errors.paidPrice ? 'border-destructive' : ''}`}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {errors.paidPrice && (
                        <p className="text-sm text-destructive mt-1">{errors.paidPrice}</p>
                      )}
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
                  </div>
                </CardContent>
              </Card>

              {/* Flight Details - Enhanced */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Flight Details</CardTitle>
                      <CardDescription>
                        Enter each flight segment (add connecting flights separately)
                      </CardDescription>
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
                        <div className="flex justify-between items-center mb-4">
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
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <Label>Airline *</Label>
                            <select
                              className="w-full h-10 px-2 rounded-lg border border-input bg-background text-sm"
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
                          </div>
                          <div>
                            <Label>Flight Number *</Label>
                            <Input
                              placeholder="1043"
                              value={flight.flightNumber.split(' ')[1] || ''}
                              onChange={(e) => {
                                const airline = flight.flightNumber.split(' ')[0] || ''
                                updateFlight(index, 'flightNumber', `${airline} ${e.target.value}`)
                              }}
                              className="text-center font-mono"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Numbers only</p>
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
                        
                        <div className="grid md:grid-cols-4 gap-3">
                          <div>
                            <Label>From (IATA) *</Label>
                            <Input
                              placeholder="CLT"
                              value={flight.origin}
                              onChange={(e) => updateFlight(index, 'origin', e.target.value.toUpperCase())}
                              maxLength={3}
                              className="text-center font-mono text-lg"
                              required
                            />
                          </div>
                          <div>
                            <Label>To (IATA) *</Label>
                            <Input
                              placeholder="LAX"
                              value={flight.destination}
                              onChange={(e) => updateFlight(index, 'destination', e.target.value.toUpperCase())}
                              maxLength={3}
                              className="text-center font-mono text-lg"
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
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {errors[`flight_${index}`] && (
                          <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <p className="text-sm text-destructive">{errors[`flight_${index}`]}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Help Section */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Need help with flight details?</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Flight numbers are on your boarding pass (e.g., AA 1043, DL 2156)</li>
                            <li>• Airport codes are 3 letters (CLT=Charlotte, LAX=Los Angeles)</li>
                            <li>• For connecting flights, add each segment separately</li>
                            <li>• Round trips need both outbound and return flights</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('method')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating Trip...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Trip
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}