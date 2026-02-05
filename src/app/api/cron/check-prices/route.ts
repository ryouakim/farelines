// src/app/api/cron/check-prices/route.ts
// API endpoint for Vercel Cron Jobs to trigger price checking
// Uses Amadeus API for real flight prices with mock fallback

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'farelines';

export const maxDuration = 60; // Maximum duration for Vercel function (60 seconds)
export const dynamic = 'force-dynamic';

// Amadeus API token cache
let amadeusToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get OAuth access token from Amadeus API
 */
async function getAmadeusToken(): Promise<string | null> {
  if (amadeusToken && tokenExpiry && Date.now() < tokenExpiry) {
    return amadeusToken;
  }

  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('Amadeus API credentials not configured');
    return null;
  }

  try {
    const baseUrl = process.env.AMADEUS_USE_PRODUCTION === 'true'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';

    const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
    });

    if (!response.ok) {
      console.error('Amadeus auth failed:', await response.text());
      return null;
    }

    const data = await response.json();
    amadeusToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    console.log('Amadeus token obtained successfully');
    return amadeusToken;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    return null;
  }
}

/**
 * Search for flight offers using Amadeus API
 */
async function searchAmadeusFlights(
  origin: string,
  destination: string,
  departureDate: string,
  adults: number = 1
): Promise<any> {
  const token = await getAmadeusToken();
  if (!token) return null;

  try {
    const baseUrl = process.env.AMADEUS_USE_PRODUCTION === 'true'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults.toString(),
      currencyCode: 'USD',
      max: '10'
    });

    const response = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Amadeus search failed:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching Amadeus flights:', error);
    return null;
  }
}

/**
 * Map Amadeus fare types to our normalized types
 */
function mapAmadeusFareType(offer: any): string {
  const travelerPricings = offer.travelerPricings?.[0];
  const fareDetailsBySegment = travelerPricings?.fareDetailsBySegment?.[0];
  const cabin = fareDetailsBySegment?.cabin;
  const fareBasis = fareDetailsBySegment?.fareBasis;

  const cabinMapping: Record<string, string> = {
    'ECONOMY': 'main_cabin',
    'PREMIUM_ECONOMY': 'premium_economy',
    'BUSINESS': 'business',
    'FIRST': 'first'
  };

  if (cabin && cabinMapping[cabin]) {
    // Check for basic economy indicators
    if (cabin === 'ECONOMY' && fareBasis) {
      if (fareBasis.includes('B') || fareBasis.includes('X') || fareBasis.includes('E')) {
        return 'basic_economy';
      }
    }
    return cabinMapping[cabin];
  }

  return 'main_cabin';
}

/**
 * Check fare prices using Amadeus API with fallback to mock data
 */
async function checkFarePrice(trip: any) {
  const useMockPrices = process.env.USE_MOCK_PRICES === 'true';

  // If mock mode is explicitly enabled, use mock data
  if (useMockPrices) {
    console.log(`Using mock prices for trip ${trip._id} (mock mode enabled)`);
    return generateMockPrice(trip);
  }

  // Try Amadeus API for real prices
  const hasAmadeusConfig = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;

  if (hasAmadeusConfig && trip.flights && trip.flights.length > 0) {
    try {
      const prices: Record<string, number> = {};
      let lowestPrice = Infinity;

      // Process each flight segment
      for (const flight of trip.flights) {
        if (!flight.origin || !flight.destination || !flight.date) {
          console.warn(`Flight missing required data for trip ${trip._id}`);
          continue;
        }

        const offers = await searchAmadeusFlights(
          flight.origin,
          flight.destination,
          flight.date,
          trip.paxCount || 1
        );

        if (offers?.data && offers.data.length > 0) {
          for (const offer of offers.data) {
            const price = parseFloat(offer.price.total);
            const fareType = mapAmadeusFareType(offer);

            prices[fareType] = Math.min(prices[fareType] || Infinity, price);
            lowestPrice = Math.min(lowestPrice, price);
          }
        }

        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (Object.keys(prices).length > 0) {
        // Get the price for the trip's fare type, or use lowest
        const currentPrice = prices[trip.fareType] || lowestPrice;

        console.log(`Amadeus price check for trip ${trip._id}: $${currentPrice}`);

        return {
          success: true,
          currentPrice: Math.round(currentPrice),
          faresByType: prices,
          source: 'amadeus'
        };
      }
    } catch (error) {
      console.error(`Amadeus API error for trip ${trip._id}:`, error);
    }
  }

  // Fallback to mock data only if explicitly enabled
  // Default is now disabled since Amadeus API should be configured
  const enableMockFallback = process.env.ENABLE_MOCK_FALLBACK === 'true';
  if (enableMockFallback) {
    console.log(`Falling back to mock prices for trip ${trip._id} (mock fallback enabled)`);
    return generateMockPrice(trip);
  }

  // No price data available
  console.warn(`No price source available for trip ${trip._id}`);
  return {
    success: false,
    error: 'No price source available'
  };
}

/**
 * Generate mock prices for testing/development
 */
function generateMockPrice(trip: any) {
  const basePrice = trip.paidPrice || 400;
  const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
  const mockPrice = Math.round(basePrice * (1 + variance));

  return {
    success: true,
    currentPrice: mockPrice,
    faresByType: {
      basic_economy: Math.round(mockPrice * 0.8),
      main_cabin: mockPrice,
      premium_economy: Math.round(mockPrice * 1.3),
      business: Math.round(mockPrice * 2.5),
      first: Math.round(mockPrice * 3.5)
    },
    source: 'mock'
  };
}

export async function GET(request: NextRequest) {
  console.log('Cron job triggered at:', new Date().toISOString());
  
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    
    // Get trips that need checking
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const trips = await db.collection('trips')
      .find({
        $or: [
          { needsCheck: true },
          { lastCheckedAt: { $lt: sixHoursAgo } },
          { lastCheckedAt: { $exists: false } }
        ],
        status: 'active'
      })
      .limit(20)
      .toArray();
    
    console.log(`Found ${trips.length} trips to check`);
    
    let processed = 0;
    let alerts = 0;
    
    // Process each trip
    for (const trip of trips) {
      try {
        // Check price
        const priceData = await checkFarePrice(trip);
        
        if (!priceData.success) continue;
        
        const isPriceDrop = priceData.currentPrice < trip.paidPrice;
        const meetsThreshold = (trip.paidPrice - priceData.currentPrice) >= (trip.thresholdUsd || 50);
        
        // Build update data
        const updateData: any = {
          lastCheckedPrice: priceData.currentPrice,
          lastCheckedAt: new Date(),
          lastCheckedFares: priceData.faresByType,
          current_fare: priceData.currentPrice,
          needsCheck: false,
          priceSource: priceData.source || 'unknown'
        };

        // Update lowest seen if this is a new low
        if (priceData.currentPrice < (trip.lowestSeenPrice || trip.lowestSeen || Infinity)) {
          updateData.lowestSeenPrice = priceData.currentPrice;
          updateData.lowestSeen = priceData.currentPrice;
          updateData.lowestSeenDate = new Date();
        }

        // Add to price history for charting
        const priceHistoryEntry = {
          price: priceData.currentPrice,
          date: new Date(),
          source: priceData.source || 'cron'
        };

        // Update trip with set and push operations
        await db.collection('trips').updateOne(
          { _id: trip._id },
          {
            $set: updateData,
            $push: {
              priceHistory: {
                $each: [priceHistoryEntry],
                $slice: -50 // Keep last 50 price points
              }
            }
          }
        );
        
        // Send alert if needed
        //if (isPriceDrop && meetsThreshold) {
          // Get user settings
        //  const user = await db.collection('users').findOne({ email: trip.userEmail });
          
          //if (user?.priceDropAlerts !== false) {
            //await sendPriceDropEmail({
              //to: trip.userEmail,
              //tripName: trip.tripName,
              //recordLocator: trip.recordLocator,
              //oldPrice: trip.paidPrice,
              //newPrice: priceData.currentPrice,
              //savings: trip.paidPrice - priceData.currentPrice,
              //fareType: trip.fareType,
              //googleFlightsUrl: trip.googleFlightsUrl,
              //flights: trip.flights
            //});
            
            alerts++;
          //}
        //}
        
        processed++;
        
      } catch (error) {
        console.error(`Error processing trip ${trip._id}:`, error);
      }
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed,
      alerts,
      message: `Processed ${processed} trips, sent ${alerts} alerts`
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
