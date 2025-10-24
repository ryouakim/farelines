import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { FareType } from '@/types/trip'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateSavings(paidPrice: number, currentPrice: number): {
  amount: number
  percentage: number
} {
  const amount = paidPrice - currentPrice
  const percentage = (amount / paidPrice) * 100
  return {
    amount: Math.max(0, amount),
    percentage: Math.max(0, percentage),
  }
}

export function getFareTypeDisplay(fareType: FareType): string {
  const displayMap: Record<FareType, string> = {
    'basic_economy': 'Basic Economy',
    'main_cabin': 'Main Cabin',
    'main_plus': 'Main Plus',
    'main_select': 'Main Select',
    'premium_economy': 'Premium Economy',
    'business': 'Business',
    'first': 'First Class',
  }
  return displayMap[fareType] || fareType
}

export function normalizeFlightNumber(flightNumber: string): {
  airline: string
  number: number
  formatted: string
} {
  const match = flightNumber.match(/^([A-Z]{2,3})\s*(\d+)$/i)
  if (!match) {
    throw new Error(`Invalid flight number format: ${flightNumber}`)
  }
  
  const airline = match[1].toUpperCase()
  const number = parseInt(match[2], 10)
  const formatted = `${airline} ${number}`
  
  return { airline, number, formatted }
}

export function normalizeIataCode(code: string): string {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Invalid IATA code: ${code}`)
  }
  return normalized
}

export function normalizePnr(pnr: string): string {
  const normalized = pnr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (normalized.length !== 6) {
    throw new Error('PNR must be exactly 6 characters')
  }
  return normalized
}

export function parseGoogleFlightsUrl(url: string): {
  gfQuery: string
  gfHash: string
  legs?: Array<{
    origin?: string
    destination?: string
    date?: string
  }>
} {
  const gfQuery = url
  
  // Create a deterministic hash from the URL
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const gfHash = Math.abs(hash).toString(36)
  
  // Try to parse the tfs parameter if present
  const legs: Array<{
    origin?: string
    destination?: string
    date?: string
  }> = []
  
  try {
    const urlObj = new URL(url)
    const tfs = urlObj.searchParams.get('tfs')
    
    if (tfs) {
      // Basic parsing of the tfs parameter
      // This is a simplified version - the actual format is complex
      const parts = tfs.split('*')
      // Parse segments if possible
      // This would need more sophisticated parsing in production
    }
  } catch (error) {
    console.error('Error parsing Google Flights URL:', error)
  }
  
  return {
    gfQuery,
    gfHash,
    legs: legs.length > 0 ? legs : undefined
  }
}

export function generateTripStatus(trip: any): {
  label: string
  color: 'green' | 'yellow' | 'red' | 'gray'
} {
  if (trip.isArchived || trip.status === 'completed') {
    return { label: 'Completed', color: 'gray' }
  }
  
  if (trip.status === 'expired') {
    return { label: 'Expired', color: 'gray' }
  }
  
  if (trip.status === 'paused') {
    return { label: 'Paused', color: 'yellow' }
  }
  
  if (trip.lastCheckedPrice && trip.paidPrice) {
    const { percentage } = calculateSavings(trip.paidPrice, trip.lastCheckedPrice)
    if (percentage > 0) {
      return { label: `Save ${percentage.toFixed(0)}%`, color: 'green' }
    } else if (percentage < -5) {
      return { label: 'Price Increased', color: 'red' }
    }
  }
  
  return { label: 'Monitoring', color: 'green' }
}
