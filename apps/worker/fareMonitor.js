/// apps/worker/fareMonitor.js
// Main fare monitoring logic - Updated for Farelines with improved scraping

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fs = require('fs');
const config = require('./config');
const logger = require('./logger');
const { sendFareAlert } = require('./emailNotifier');

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

// ===== Core Functions =====

/**
 * Extract Google Flights parameters from URL
 */
function parseGoogleFlightsUrl(url) {
  try {
    const urlObj = new URL(url);
    const tfs = urlObj.searchParams.get('tfs');
    
    if (!tfs) return null;
    
    return {
      query: url,
      hash: crypto.createHash('md5').update(tfs).digest('hex'),
      tfs: tfs
    };
  } catch (error) {
    logger.error('Error parsing URL', { url, error: error.message });
    return null;
  }
}

/**
 * Scrape Google Flights for current prices with improved selectors
 */
async function scrapeGoogleFlights(url, retryCount = 0) {
  const browser = await puppeteer.launch({
    headless: config.SCRAPING.HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Randomize user agent
    const userAgent = config.SCRAPING.USER_AGENTS[
      Math.floor(Math.random() * config.SCRAPING.USER_AGENTS.length)
    ];
    await page.setUserAgent(userAgent);
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    logger.debug('Navigating to Google Flights', { url });
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: config.SCRAPING.TIMEOUT
    });
    
    // Wait a bit for dynamic content to load
    await page.waitForTimeout(3000);
    
    // Debug: save screenshot and HTML if enabled
    if (process.env.DEBUG_SCRAPING === 'true') {
      try {
        await page.screenshot({ path: `debug-screenshot-${Date.now()}.png` });
        const html = await page.content();
        fs.writeFileSync(`debug-page-${Date.now()}.html`, html);
        console.log('Debug files saved');
      } catch (debugError) {
        console.log('Debug file save failed:', debugError.message);
      }
    }
    
    // Extract price data with updated selectors
    const priceData = await page.evaluate(() => {
      const prices = {};
      
      // Updated selectors for current Google Flights (December 2024)
      const priceSelectors = [
        // Primary selectors
        '[data-gs-price]',
        '[aria-label*="$"] [data-gs]',
        '[role="button"][aria-label*="$"]',
        
        // Price display selectors
        '.pIav2d',
        '.YMlIz', 
        '.yR1fYc',
        '.gws-flights-results__price',
        '[data-flt-ve="price"]',
        
        // Backup selectors
        '[data-testid*="price"]',
        '.price-text',
        '[class*="price"]',
        
        // Text-based search
        '*'
      ];
      
      console.log('Starting price extraction...');
      
      // Try each selector
      for (const selector of priceSelectors.slice(0, -1)) { // Skip '*' for now
        try {
          const elements = document.querySelectorAll(selector);
          console.log(`Selector ${selector}: found ${elements.length} elements`);
          
          elements.forEach((el, index) => {
            const priceText = el.textContent || el.getAttribute('data-gs-price') || el.getAttribute('aria-label');
            if (priceText) {
              // Look for price patterns like $123, 123, USD 123
              const priceMatches = priceText.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
              if (priceMatches) {
                priceMatches.forEach(match => {
                  const price = parseFloat(match.replace(/[$,]/g, ''));
                  if (!isNaN(price) && price > 50 && price < 10000) { // Reasonable flight price range
                    prices.main = price;
                    console.log(`Found price: $${price} from selector: ${selector}, element ${index}`);
                    console.log(`Price text: "${priceText}"`);
                  }
                });
              }
            }
          });
          
          if (Object.keys(prices).length > 0) {
            console.log('Price found, stopping search');
            break;
          }
        } catch (selectorError) {
          console.log(`Selector ${selector} failed:`, selectorError.message);
        }
      }
      
      // Last resort: search all text content for prices
      if (Object.keys(prices).length === 0) {
        console.log('No prices found with selectors, trying text search...');
        const bodyText = document.body.textContent || '';
        const priceMatches = bodyText.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
        if (priceMatches) {
          // Get the first reasonable price
          for (const match of priceMatches) {
            const price = parseFloat(match.replace(/[$,]/g, ''));
            if (price > 50 && price < 10000) {
              prices.main = price;
              console.log(`Found price via text search: $${price}`);
              break;
            }
          }
        }
      }
      
      return prices;
    });
    
    await browser.close();
    
    if (Object.keys(priceData).length === 0) {
      throw new Error('No prices found on page');
    }
    
    logger.info('Scraping successful', { prices: priceData });
    return priceData;
    
  } catch (error) {
    await browser.close();
    
    if (retryCount < config.SCRAPING.RETRY_COUNT) {
      logger.warn(`Scraping failed, retrying (${retryCount + 1}/${config.SCRAPING.RETRY_COUNT})`, {
        error: error.message
      });
      await new Promise(resolve => setTimeout(resolve, config.SCRAPING.RETRY_DELAY));
      return scrapeGoogleFlights(url, retryCount + 1);
    }
    
    // If all retries failed, return mock data for testing
    if (process.env.USE_MOCK_PRICES === 'true') {
      logger.warn('Using mock price data for testing');
      const mockPrice = Math.floor(Math.random() * 500) + 200; // Random price between $200-$700
      return { main: mockPrice };
    }
    
    throw error;
  }
}

/**
 * Map scraped fare types to our normalized types
 */
function normalizeFareType(scrapedType) {
  const mapping = {
    'basic': 'basic_economy',
    'basic economy': 'basic_economy',
    'main': 'main_cabin',
    'main cabin': 'main_cabin',
    'main plus': 'main_plus',
    'main select': 'main_select',
    'comfort+': 'premium_economy',
    'premium': 'premium_economy',
    'premium economy': 'premium_economy',
    'business': 'business',
    'first': 'first',
    'delta one': 'first'
  };
  
  const normalized = scrapedType?.toLowerCase().replace(/\s+/g, ' ').trim();
  return mapping[normalized] || scrapedType;
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
    
    if (!trip.googleFlightsUrl) {
      logger.warn('Trip missing Google Flights URL', { id: trip._id });
      return null;
    }
    
    // Scrape current prices
    const scrapedPrices = await scrapeGoogleFlights(trip.googleFlightsUrl);
    
    // Normalize and find matching fare type
    const normalizedPrices = {};
    let currentPrice = null;
    
    for (const [type, price] of Object.entries(scrapedPrices)) {
      const normalizedType = normalizeFareType(type);
      normalizedPrices[normalizedType] = price;
      
      if (normalizedType === trip.fareType) {
        currentPrice = price;
      }
    }
    
    // If exact fare type not found, use main price or lowest
    if (!currentPrice) {
      currentPrice = normalizedPrices.main_cabin || 
                    normalizedPrices.main ||
                    Math.min(...Object.values(normalizedPrices));
    }
    
    // Determine if this is a price drop worth alerting
    const paidPrice = trip.paidPrice || trip.bookedPrice;
    const threshold = trip.thresholdUsd || config.ALERTS.MIN_SAVINGS_AMOUNT;
    const savings = paidPrice - currentPrice;
    const savingsPercent = (savings / paidPrice) * 100;
    
    const shouldAlert = savings >= threshold && 
                       savings >= config.ALERTS.MIN_SAVINGS_AMOUNT &&
                       savingsPercent >= config.ALERTS.MIN_SAVINGS_PERCENT;
    
    // Check cooldown
    const lastAlertAt = trip.lastAlertAt ? new Date(trip.lastAlertAt) : null;
    const cooldownHours = config.ALERTS.COOLDOWN_HOURS;
    const cooldownExpired = !lastAlertAt || 
      (Date.now() - lastAlertAt.getTime()) > cooldownHours * 60 * 60 * 1000;
    
    // Update trip in database
    const updateData = {
      lastCheckedAt: new Date(),
      lastCheckedPrice: currentPrice,
      current_fare: currentPrice,
      lastCheckedFares: normalizedPrices,
      needsCheck: false
    };
    
    // Update lowest seen
    if (!trip.lowestSeen || currentPrice < trip.lowestSeen) {
      updateData.lowestSeen = currentPrice;
      updateData.lowestSeenDate = new Date();
    }
    
    // Update lowest by fare type
    if (!trip.lowestSeenByFareType) {
      updateData.lowestSeenByFareType = normalizedPrices;
    } else {
      updateData.lowestSeenByFareType = { ...trip.lowestSeenByFareType };
      for (const [type, price] of Object.entries(normalizedPrices)) {
        if (!updateData.lowestSeenByFareType[type] || price < updateData.lowestSeenByFareType[type]) {
          updateData.lowestSeenByFareType[type] = price;
        }
      }
    }
    
    // Send alert if conditions met
    if (shouldAlert && cooldownExpired) {
      logger.info('Price drop detected!', {
        trip: trip.tripName,
        paidPrice,
        currentPrice,
        savings,
        savingsPercent: savingsPercent.toFixed(1)
      });
      
      // Get user preferences
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
        
        // Send email
        const emailResult = await sendFareAlert(trip, alerts);
        
        if (emailResult.sent) {
          updateData.lastAlertAt = new Date();
          updateData.lastAlertPrice = currentPrice;
          
          // Record alert in database
          await db.collection('alerts').insertOne({
            tripId: trip._id,
            userEmail: trip.userEmail,
            type: 'price_drop',
            paidPrice,
            currentPrice,
            savings,
            savingsPercent,
            fareType: trip.fareType,
            sentAt: new Date(),
            emailMessageId: emailResult.messageId
          });
        }
      }
    }
    
    // Update trip
    await db.collection(config.TRIPS_COLLECTION).updateOne(
      { _id: trip._id },
      { $set: updateData }
    );
    
    logger.info('Trip check completed', { 
      id: trip._id,
      currentPrice,
      alert: shouldAlert && cooldownExpired 
    });
    
    return { currentPrice, normalizedPrices, alert: shouldAlert };
    
  } catch (error) {
    logger.error('Error checking trip', { 
      id: trip._id, 
      error: error.message 
    });
    
    // Mark as checked with error
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
 * Run a full sweep of all active trips
 */
async function runOnce() {
  const db = await connectDB();
  
  try {
    // Find trips that need checking
    const trips = await db.collection(config.TRIPS_COLLECTION)
      .find({
        status: { $ne: 'inactive' },
        googleFlightsUrl: { $exists: true, $ne: '' },
        // Check trips with flights in the future
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
        
        // Rate limiting
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
    
    logger.info('Run complete', { 
      total: trips.length, 
      success: successCount, 
      errors: errorCount 
    });
    
  } catch (error) {
    logger.error('Run failed', { error: error.message });
    throw error;
  }
}

// Export for use by cronService and API
module.exports = {
  connectDB,
  checkTrip,
  runOnce,
  scrapeGoogleFlights,
  parseGoogleFlightsUrl
};

// If run directly, do a single sweep
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