import { ObjectId } from 'mongodb'

export type FareType = 
  | 'basic_economy'
  | 'main_cabin'
  | 'main_plus'
  | 'main_select'
  | 'premium_economy'
  | 'business'
  | 'first'

export type TripStatus = 'active' | 'completed' | 'expired' | 'paused'

export interface Flight {
  flightNumber: string // e.g., "AA 1995"
  airline?: string // derived "AA"
  flightNumberNum?: number // derived 1995
  date: string // "YYYY-MM-DD"
  origin: string // IATA code (CLT)
  destination: string // IATA code (LAX)
  departureTimeLocal?: string // "HH:mm"
  departureTz?: string // IANA TZ
  departureUtc?: Date
  notified?: boolean
  lastCheckedPrice?: number
  carrier?: string
}

export interface Trip {
  _id?: ObjectId | string
  userEmail: string
  tripName: string
  recordLocator: string // 6-char PNR, uppercase
  paxCount: number
  ptc: string // "ADT", "CHD", etc.
  
  // Pricing
  paidPrice: number // canonical paid price
  bookedPrice?: number // for backward compatibility
  fareType: FareType
  thresholdUsd: number // minimum savings to alert
  
  // Google Flights integration
  googleFlightsUrl?: string
  gfQuery?: string // derived from URL
  gfHash?: string // for worker compatibility
  
  // Flight legs
  flights: Flight[]
  
  // Worker-maintained fields
  lastCheckedAt?: Date
  lastCheckedPrice?: number
  current_fare?: number
  lowestSeen?: number
  lastCheckedFares?: Record<string, number>
  lowestSeenByFareType?: Record<string, number>
  lastCheckAlerts?: any[]
  
  // Trip lifecycle
  status: TripStatus
  isArchived: boolean
  needsCheck?: boolean // Flag for worker to process
  
  createdAt: Date
  updatedAt: Date
}

export interface User {
  _id?: ObjectId | string
  email: string
  name?: string
  image?: string
  emailVerified?: Date
  marketingOptIn: boolean
  notificationPreferences: {
    emailAlerts: boolean
    priceDropThreshold: number // percentage
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  createdAt: Date
  updatedAt: Date
}

export interface PriceAlert {
  _id?: ObjectId | string
  tripId: string
  userEmail: string
  fareType: FareType
  paidPrice: number
  currentPrice: number
  savings: number
  percentSaved: number
  googleFlightsUrl?: string
  sentAt: Date
  opened?: boolean
  clicked?: boolean
}

export interface WorkerQueue {
  _id?: ObjectId | string
  tripId: string
  reason: 'created' | 'updated' | 'manual_check'
  priority: number
  attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  createdAt: Date
  processedAt?: Date
}
