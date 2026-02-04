import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Parse Google Flights URL to extract flight information
export function parseGoogleFlightsUrl(url: string) {
  try {
    const urlObj = new URL(url)
    const searchParams = urlObj.searchParams
    
    // Extract basic flight info from Google Flights URL
    const result = {
      origin: searchParams.get('f[0].d') || '',
      destination: searchParams.get('f[0].a') || '',
      departureDate: searchParams.get('f[0].dt') || '',
      returnDate: searchParams.get('f[1].dt') || '',
      passengers: searchParams.get('p') || '1',
      cabin: searchParams.get('c') || 'economy'
    }
    
    return result
  } catch (error) {
    console.error('Error parsing Google Flights URL:', error)
    return null
  }
}

// Extract fare type from various sources
export function normalizeFareType(fareType: string): string {
  const normalized = fareType.toLowerCase().replace(/\s+/g, '_')
  
  const fareMap: { [key: string]: string } = {
    'basic': 'basic_economy',
    'basic_economy': 'basic_economy',
    'economy': 'main_cabin',
    'main': 'main_cabin',
    'main_cabin': 'main_cabin',
    'premium_economy': 'premium_economy',
    'business': 'business',
    'first': 'first',
    'main_plus': 'main_plus',
    'main_select': 'main_select'
  }
  
  return fareMap[normalized] || 'main_cabin'
}

// Generate a unique hash for Google Flights URLs
export function generateGfHash(url: string): string {
  try {
    const urlObj = new URL(url)
    const tfsParam = urlObj.searchParams.get('tfs')
    
    if (tfsParam) {
      // Use the tfs parameter as the hash base
      return btoa(tfsParam).replace(/[+/=]/g, '').substring(0, 12)
    }
    
    // Fallback: hash key search parameters
    const keyParams = ['f[0].d', 'f[0].a', 'f[0].dt', 'f[1].dt', 'p', 'c']
    const paramString = keyParams
      .map(param => `${param}=${urlObj.searchParams.get(param) || ''}`)
      .join('&')
    
    return btoa(paramString).replace(/[+/=]/g, '').substring(0, 12)
  } catch (error) {
    console.error('Error generating GF hash:', error)
    return Math.random().toString(36).substring(2, 14)
  }
}

// Validate flight data
export function validateFlightData(flight: any): boolean {
  return !!(
    flight.origin &&
    flight.destination &&
    flight.date &&
    flight.origin.length === 3 &&
    flight.destination.length === 3 &&
    /^\d{4}-\d{2}-\d{2}$/.test(flight.date)
  )
}

// Calculate savings percentage
export function calculateSavingsPercent(paidPrice: number, currentPrice: number): number {
  if (!paidPrice || paidPrice <= 0) return 0
  return Math.round(((paidPrice - currentPrice) / paidPrice) * 100)
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  
  return formatDate(dateString)
}