// apps/worker/dynamicUrlGenerator.js
// Generate Google Flights URLs dynamically from flight details

const crypto = require('crypto');

/**
 * Build a Google Flights URL from trip details
 * This is more reliable than static URLs that can go stale
 */
function buildGoogleFlightsUrl(trip) {
  if (!trip.flights || trip.flights.length === 0) {
    return null;
  }

  try {
    const baseUrl = 'https://www.google.com/travel/flights';
    
    // Sort flights by date
    const sortedFlights = [...trip.flights].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Build search parameters
    const params = new URLSearchParams();
    
    // Basic search type
    params.append('hl', 'en');
    params.append('curr', 'USD');
    
    // Origin and destination
    const firstFlight = sortedFlights[0];
    const lastFlight = sortedFlights[sortedFlights.length - 1];
    
    params.append('f', '0'); // Search flights
    params.append('tfs', buildTfsParameter(sortedFlights, trip));
    
    return `${baseUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Error building Google Flights URL:', error);
    return null;
  }
}

/**
 * Build the tfs parameter for Google Flights
 */
function buildTfsParameter(flights, trip) {
  // This is a simplified version - Google's tfs parameter is complex
  // For a production system, you'd want to reverse-engineer more of their format
  
  const segments = flights.map(flight => {
    const date = flight.date.replace(/-/g, ''); // YYYYMMDD format
    return {
      origin: flight.origin,
      destination: flight.destination,
      date: date,
      flightNumber: flight.flightNumber
    };
  });
  
  // Create a hash-based tfs parameter
  const flightString = segments.map(s => 
    `${s.origin}-${s.destination}-${s.date}-${s.flightNumber}`
  ).join('|');
  
  return crypto.createHash('md5').update(flightString).digest('hex');
}

/**
 * Alternative: Use Google Flights search URL format
 * This is more reliable and commonly used
 */
function buildSearchUrl(trip) {
  if (!trip.flights || trip.flights.length === 0) {
    return null;
  }

  try {
    const sortedFlights = [...trip.flights].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Determine if round trip or one way
    const isRoundTrip = sortedFlights.length >= 2 && 
                       sortedFlights[0].origin === sortedFlights[sortedFlights.length - 1].destination;
    
    let url;
    
    if (isRoundTrip && sortedFlights.length === 2) {
      // Round trip
      const outbound = sortedFlights[0];
      const returnFlight = sortedFlights[1];
      
      url = `https://www.google.com/travel/flights/search` +
            `?tfs=CBwQAhopEgoyMDI2LTAyLTA5IgNDTERyBwgBEgNDTEVaAktBcAE` +
            `ag4YAgaQDw&tfu=CnRDaENBTjFRSE5XZTA5UkJEWmxOekZyTDFjNVFsSUVRblJCWkVJMGMyOUVjRUU`;
      
      // Replace with actual flight data
      const departDate = outbound.date.replace(/-/g, '');
      const returnDate = returnFlight.date.replace(/-/g, '');
      
      url = `https://www.google.com/travel/flights/search` +
            `?tfs=CBwQAhpJEgo${departDate.slice(0,4)}-${departDate.slice(4,6)}-${departDate.slice(6,8)}` +
            `IgNDTEVyBwgBEgNDTEVaAUtBcAGCKEIBQAFwAYYCCHPQA` +
            `&hl=en&curr=USD`;
    } else {
      // One way or multi-city - use simple search format
      const firstFlight = sortedFlights[0];
      const departDate = firstFlight.date;
      
      url = `https://www.google.com/travel/flights/search` +
            `?tfs=CBwQAhpJEgo${departDate}IgMKA${firstFlight.origin}SgMKA${firstFlight.destination}cAE` +
            `&hl=en&curr=USD&adults=1`;
    }
    
    return url;
    
  } catch (error) {
    console.error('Error building search URL:', error);
    return null;
  }
}

/**
 * Generate multiple URL strategies for a trip
 */
function generateFlightUrls(trip) {
  const urls = [];
  
  // Strategy 1: Use existing URL if valid and recent
  if (trip.googleFlightsUrl && isUrlRecent(trip.updatedAt)) {
    urls.push({
      type: 'existing',
      url: trip.googleFlightsUrl,
      priority: 1
    });
  }
  
  // Strategy 2: Build search URL from flight details
  const searchUrl = buildSearchUrl(trip);
  if (searchUrl) {
    urls.push({
      type: 'search',
      url: searchUrl,
      priority: 2
    });
  }
  
  // Strategy 3: Generic search by route and date
  if (trip.flights && trip.flights.length > 0) {
    const flight = trip.flights[0];
    const genericUrl = `https://www.google.com/travel/flights/search` +
                      `?q=${flight.origin}%20to%20${flight.destination}%20${flight.date}`;
    urls.push({
      type: 'generic',
      url: genericUrl,
      priority: 3
    });
  }
  
  return urls.sort((a, b) => a.priority - b.priority);
}

/**
 * Check if URL was updated recently (within 7 days)
 */
function isUrlRecent(updatedAt) {
  if (!updatedAt) return false;
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return new Date(updatedAt).getTime() > sevenDaysAgo;
}

/**
 * Update trip with fresh URL if needed
 */
async function refreshTripUrl(db, trip) {
  const urls = generateFlightUrls(trip);
  
  if (urls.length > 0 && urls[0].type !== 'existing') {
    // Update trip with new URL
    await db.collection('trips').updateOne(
      { _id: trip._id },
      { 
        $set: { 
          googleFlightsUrl: urls[0].url,
          gfQuery: urls[0].url,
          urlRefreshedAt: new Date(),
          urlGenerationType: urls[0].type
        }
      }
    );
    
    console.log(`Updated trip ${trip._id} with ${urls[0].type} URL`);
    return urls[0].url;
  }
  
  return trip.googleFlightsUrl;
}

module.exports = {
  buildGoogleFlightsUrl,
  buildSearchUrl,
  generateFlightUrls,
  refreshTripUrl
};