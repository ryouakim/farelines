// src/app/api/cron/check-prices/route.ts
// API endpoint for Vercel Cron Jobs to trigger price checking

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendPriceDropEmail } from '@/lib/emails/send';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'farelines';

export const maxDuration = 60; // Maximum duration for Vercel function (60 seconds)
export const dynamic = 'force-dynamic';

async function checkFarePrice(trip: any) {
  // Mock implementation - replace with actual Google Flights API
  const basePrice = trip.paidPrice;
  const variance = (Math.random() - 0.5) * 200;
  const currentPrice = Math.max(50, basePrice + variance);
  
  return {
    success: true,
    currentPrice: Math.round(currentPrice),
    faresByType: {
      basic_economy: Math.round(currentPrice * 0.8),
      main_cabin: Math.round(currentPrice),
      premium_economy: Math.round(currentPrice * 1.3),
      business: Math.round(currentPrice * 2.5),
      first: Math.round(currentPrice * 3.5)
    }
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
        
        // Update trip
        await db.collection('trips').updateOne(
          { _id: trip._id },
          {
            $set: {
              lastCheckedPrice: priceData.currentPrice,
              lastCheckedAt: new Date(),
              lastCheckedFares: priceData.faresByType,
              current_fare: priceData.currentPrice,
              needsCheck: false,
              ...(priceData.currentPrice < (trip.lowestSeen || Infinity) && {
                lowestSeen: priceData.currentPrice,
                lowestSeenDate: new Date()
              })
            }
          }
        );
        
        // Send alert if needed
        if (isPriceDrop && meetsThreshold) {
          // Get user settings
          const user = await db.collection('users').findOne({ email: trip.userEmail });
          
          if (user?.priceDropAlerts !== false) {
            await sendPriceDropEmail({
              to: trip.userEmail,
              tripName: trip.tripName,
              recordLocator: trip.recordLocator,
              oldPrice: trip.paidPrice,
              newPrice: priceData.currentPrice,
              savings: trip.paidPrice - priceData.currentPrice,
              fareType: trip.fareType,
              googleFlightsUrl: trip.googleFlightsUrl,
              flights: trip.flights
            });
            
            alerts++;
          }
        }
        
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
