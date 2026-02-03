// apps/worker/fareMonitor-amadeus.js
// Updated fare monitoring with Amadeus API integration

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config');
const logger = require('./logger');
const { sendFareAlert } = require('./emailNotifier');
const flightDataService = require('./flightDataService');

// ===== Database Connection =====
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  
  const client = await MongoClient.connect(config.MONGO_URI, {
    useUnifiedTopology: true
  });
  
  cachedDb = client.db(config.DB_NAME);
  logger.info('Connected to MongoDB', { db: config.DB_NAME });
  return cachedDb;
}

/**
 * Generate mock prices for testing/fallback
 */
function generateMockPrice(trip) {
  const basePrice = trip.paidPrice || 400;
  const variance = (Math.random() - 0.5) * 0.4;
  const mockPrice = Math.round(basePrice * (1 + variance));
  
  logger.info('Generated mock price', { 
    tripId: trip._id, 
    paidPrice: basePrice, 
    mockPrice 
  });
  
  return { [trip.fareType]: mockPrice };
}

/**
 * Get flight prices using multiple strategies
 */
async function getFlightPrices(trip) {
  // Strategy 1: Use mock prices if enabled
  if (process.env.USE_MOCK_PRICES === 'true') {
    logger.warn('Using mock price data for testing');
    return generateMockPrice(trip);
  }

  // Strategy 2: Use Amadeus API for flight lookup
  if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
    try {
      return await flightDataService.getFlightPrices(trip);
    } catch (error) {
      logger.warn('Amadeus API failed, falling back', { 
        error: error.message,
        tripId: trip._id 
      });
      
      // Fall back to mock prices if API fails
      if (process.env.ENABLE_MOCK_FALLBACK === 'true') {
        return generateMockPrice(trip);
      }
      throw error;
    }
  }

  // Strategy 3: Use Google Flights URL if available (legacy)
  if (trip.googleFlightsUrl) {
    logger.warn('No Amadeus API configured, would try Google Flights scraping');
    throw new Error('Google Flights scraping disabled - configure Amadeus API or enable mock prices');
  }

  throw new Error('No price lookup method available - need Amadeus API credentials or flight data');
}

/**
 * Check a single trip for price changes
 */
async function checkTrip(db, trip) {
  try {
    logger.info('Checking trip', { 
      id: trip._id, 
      name: trip.tripName,
      pnr: trip.recordLocator 
    });
    
    // Validate trip has flight data
    if (!trip.flights || trip.flights.length === 0) {
      logger.warn('Trip missing flight data', { id: trip._id });
      return null;
    }

    // Get current prices
    const currentPrices = await getFlightPrices(trip);
    
    // Find price for this trip's fare type
    let currentPrice = currentPrices[trip.fareType];
    if (!currentPrice) {
      // Use lowest available price if exact fare type not found
      currentPrice = Math.min(...Object.values(currentPrices));
      logger.info('Using lowest price as fallback', { 
        tripId: trip._id,
        requestedFareType: trip.fareType,
        availableFareTypes: Object.keys(currentPrices),
        price: currentPrice
      });
    }
    
    // Calculate savings
    const paidPrice = trip.paidPrice || trip.bookedPrice;
    const threshold = trip.thresholdUsd || config.ALERTS.MIN_SAVINGS_AMOUNT;
    const savings = paidPrice - currentPrice;
    const savingsPercent = (savings / paidPrice) * 100;
    
    const shouldAlert = savings >= threshold && 
                       savings >= config.ALERTS.MIN_SAVINGS_AMOUNT &&
                       savingsPercent >= config.ALERTS.MIN_SAVINGS_PERCENT;
    
    // Check alert cooldown
    const lastAlertAt = trip.lastAlertAt ? new Date(trip.lastAlertAt) : null;
    const cooldownHours = config.ALERTS.COOLDOWN_HOURS;
    const cooldownExpired = !lastAlertAt || 
      (Date.now() - lastAlertAt.getTime()) > cooldownHours * 60 * 60 * 1000;
    
    // Prepare database update
    const updateData = {
      lastCheckedAt: new Date(),
      lastCheckedPrice: currentPrice,
      current_fare: currentPrice,
      lastCheckedFares: currentPrices,
      needsCheck: false,
      priceSource: process.env.USE_MOCK_PRICES === 'true' ? 'mock' : 'amadeus'
    };
    
    // Update lowest seen prices
    if (!trip.lowestSeen || currentPrice < trip.lowestSeen) {
      updateData.lowestSeen = currentPrice;
      updateData.lowestSeenDate = new Date();
    }
    
    // Update lowest by fare type
    if (!trip.lowestSeenByFareType) {
      updateData.lowestSeenByFareType = currentPrices;
    } else {
      updateData.lowestSeenByFareType = { ...trip.lowestSeenByFareType };
      for (const [type, price] of Object.entries(currentPrices)) {
        if (!updateData.lowestSeenByFareType[type] || price < updateData.lowestSeenByFareType[type]) {
          updateData.lowestSeenByFareType[type] = price;
        }
      }
    }
    
    // Send alert if conditions are met
    if (shouldAlert && cooldownExpired) {
      logger.info('Price drop detected!', {
        trip: trip.tripName,
        paidPrice,
        currentPrice,
        savings,
        savingsPercent: savingsPercent.toFixed(1)
      });
      
      // Check user preferences
      const user = await db.collection(config.USERS_COLLECTION).findOne({ 
        email: trip.userEmail 
      });
      
      if (user?.priceDropAlerts !== false) {
        const alerts = [{
          fareType: trip.fareType,
          paidPrice,
          currentPrice,
          savings,
          percentSavings: savingsPercent.toFixed(1)
        }];
        
        // Send email alert
        try {
          const emailResult = await sendFareAlert(trip, alerts);
          
          if (emailResult.sent) {
            updateData.lastAlertAt = new Date();
            updateData.lastAlertPrice = currentPrice;
            
            // Log alert in database
            await db.collection('alerts').insertOne({
              tripId: trip._id,
              userEmail: trip.userEmail,
              type: 'price_drop',
              paidPrice,
              currentPrice,
              savings,
              savingsPercent,
              fareType: trip.fareType,
              priceSource: updateData.priceSource,
              sentAt: new Date(),
              emailMessageId: emailResult.messageId
            });
          }
        } catch (emailError) {
          logger.error('Failed to send alert email', {
            tripId: trip._id,
            error: emailError.message
          });
        }
      }
    }
    
    // Update trip in database
    await db.collection(config.TRIPS_COLLECTION).updateOne(
      { _id: trip._id },
      { $set: updateData }
    );
    
    logger.info('Trip check completed', { 
      id: trip._id,
      currentPrice,
      alert: shouldAlert && cooldownExpired,
      priceSource: updateData.priceSource
    });
    
    return { currentPrice, currentPrices, alert: shouldAlert };
    
  } catch (error) {
    logger.error('Error checking trip', { 
      id: trip._id, 
      error: error.message 
    });
    
    // Mark trip as checked with error
    await db.collection(config.TRIPS_COLLECTION).updateOne(
      { _id: trip._id },
      { 
        $set: { 
          lastCheckedAt: new Date(),
          lastCheckError: error.message,
          needsCheck: false
        }
      }
    );
    
    throw error;
  }
}

/**
 * Run a full monitoring sweep
 */
async function runOnce() {
  const db = await connectDB();
  
  try {
    // Find active trips with flight data
    const trips = await db.collection(config.TRIPS_COLLECTION)
      .find({
        status: { $ne: 'inactive' },
        flights: { $exists: true, $not: { $size: 0 } },
        // Only check future trips
        'flights.0.date': { $gte: new Date().toISOString().slice(0, 10) }
      })
      .toArray();
    
    logger.info(`Found ${trips.length} active trips to check`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const trip of trips) {
      try {
        await checkTrip(db, trip);
        successCount++;
        
        // Rate limiting between checks
        if (config.MONITORING.RATE_LIMIT_DELAY_MS > 0) {
          await new Promise(resolve => setTimeout(resolve, config.MONITORING.RATE_LIMIT_DELAY_MS));
        }
      } catch (error) {
        errorCount++;
        logger.error('Failed to check trip', { 
          id: trip._id, 
          error: error.message 
        });
      }
    }
    
    logger.info('Monitoring run complete', { 
      total: trips.length, 
      success: successCount, 
      errors: errorCount 
    });
    
  } catch (error) {
    logger.error('Monitoring run failed', { error: error.message });
    throw error;
  }
}

// Export functions
module.exports = {
  connectDB,
  checkTrip,
  runOnce,
  getFlightPrices
};

// If run directly, execute monitoring sweep
if (require.main === module) {
  runOnce()
    .then(() => {
      logger.info('Direct run completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Direct run failed', { error: error.message });
      process.exit(1);
    });
}
