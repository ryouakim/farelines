// apps/worker/flightDataService.js
// Amadeus API integration for flight price monitoring

const https = require('https');
const config = require('./config');
const logger = require('./logger');

class AmadeusFlightService {
  constructor() {
    this.baseUrl = 'https://test.api.amadeus.com'; // Use production URL later
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token from Amadeus
   */
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    return new Promise((resolve, reject) => {
      const postData = `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`;
      
      const options = {
        hostname: 'test.api.amadeus.com',
        port: 443,
        path: '/v1/security/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.access_token) {
              this.accessToken = response.access_token;
              this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // 1 min buffer
              logger.info('Amadeus token obtained');
              resolve(this.accessToken);
            } else {
              reject(new Error('Failed to get access token: ' + data));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Search for flight offers by origin, destination, and date
   */
  async searchFlightOffers(origin, destination, departureDate, adults = 1) {
    const token = await this.getAccessToken();
    
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate, // YYYY-MM-DD format
        adults: adults.toString(),
        currencyCode: 'USD',
        max: '10'
      });

      const options = {
        hostname: 'test.api.amadeus.com',
        port: 443,
        path: `/v2/shopping/flight-offers?${params.toString()}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Get flight prices for a specific trip
   */
  async getFlightPrices(trip) {
    try {
      logger.info('Looking up flight prices via Amadeus', { 
        tripId: trip._id, 
        tripName: trip.tripName 
      });

      const prices = {};
      let lowestPrice = Infinity;

      // Process each flight segment
      for (const flight of trip.flights) {
        if (!flight.origin || !flight.destination || !flight.date) {
          logger.warn('Flight missing required data', { 
            flight: flight.flightNumber,
            missing: {
              origin: !flight.origin,
              destination: !flight.destination,
              date: !flight.date
            }
          });
          continue;
        }

        const offers = await this.searchFlightOffers(
          flight.origin, 
          flight.destination, 
          flight.date,
          trip.paxCount || 1
        );

        if (offers.data && offers.data.length > 0) {
          for (const offer of offers.data) {
            const price = parseFloat(offer.price.total);
            const fareType = this.mapAmadeusFareType(offer);
            
            prices[fareType] = Math.min(prices[fareType] || Infinity, price);
            lowestPrice = Math.min(lowestPrice, price);

            logger.debug('Found flight offer', {
              price: price,
              fareType: fareType,
              airline: offer.validatingAirlineCodes?.[0],
              segments: offer.itineraries?.[0]?.segments?.length
            });
          }
        }

        // Rate limiting to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (Object.keys(prices).length === 0) {
        throw new Error('No flight offers found');
      }

      // Ensure we have the trip's fare type
      if (!prices[trip.fareType]) {
        prices[trip.fareType] = lowestPrice;
      }

      logger.info('Flight price lookup successful', {
        tripId: trip._id,
        prices: prices,
        fareTypes: Object.keys(prices)
      });

      return prices;

    } catch (error) {
      logger.error('Amadeus API error', { 
        tripId: trip._id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Map Amadeus fare types to our normalized types
   */
  mapAmadeusFareType(offer) {
    const travelerPricings = offer.travelerPricings?.[0];
    const fareDetailsBySegment = travelerPricings?.fareDetailsBySegment?.[0];
    const cabin = fareDetailsBySegment?.cabin;
    const fareBasis = fareDetailsBySegment?.fareBasis;

    // Map cabin classes
    const cabinMapping = {
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

    // Default to main cabin
    return 'main_cabin';
  }
}

module.exports = new AmadeusFlightService();
