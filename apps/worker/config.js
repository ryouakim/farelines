// apps/worker/config.js - Enhanced configuration for Farelines with Amadeus API
require('dotenv').config({ path: '../../.env.local' });

module.exports = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database - Updated for Farelines
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  DB_NAME: process.env.MONGODB_DB || process.env.DB_NAME || 'bearlines',
  TRIPS_COLLECTION: process.env.TRIPS_COLLECTION || 'trips',
  USERS_COLLECTION: process.env.USERS_COLLECTION || 'users',
  ALERTS_COLLECTION: process.env.ALERTS_COLLECTION || 'alerts',
  JOBS_COLLECTION: process.env.JOBS_COLLECTION || 'price_check_jobs',
  
  // Amadeus API Configuration
  AMADEUS: {
    API_KEY: process.env.AMADEUS_API_KEY,
    API_SECRET: process.env.AMADEUS_API_SECRET,
    BASE_URL: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
    PRODUCTION_URL: 'https://api.amadeus.com',
    USE_PRODUCTION: process.env.AMADEUS_USE_PRODUCTION === 'true',
    TOKEN_CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
    RATE_LIMIT: {
      REQUESTS_PER_SECOND: 10,
      REQUESTS_PER_MONTH: process.env.AMADEUS_MONTHLY_LIMIT || 2000,
      BURST_LIMIT: 50
    }
  },

  // Email settings - Using your existing Gmail setup
  EMAIL: {
    USE_GMAIL: true,
    GMAIL_USER: process.env.GMAIL_USER || process.env.SMTP_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD,
    DEFAULT_FROM: process.env.FROM_EMAIL || process.env.SMTP_FROM || 'Farelines <noreply@farelines.com>',
    DEFAULT_REPLY_TO: process.env.REPLY_TO || process.env.SMTP_FROM,
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  },
  
  // Scraping settings (legacy - for fallback)
  SCRAPING: {
    HEADLESS: process.env.HEADLESS !== 'false',
    TIMEOUT: parseInt(process.env.SCRAPE_TIMEOUT || '60000'),
    RETRY_COUNT: parseInt(process.env.RETRY_COUNT || '3'),
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '5000'),
    RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY || '3000'),
    USER_AGENTS: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  },
  
  // Alert settings with user customization support
  ALERTS: {
    MIN_SAVINGS_AMOUNT: parseFloat(process.env.MIN_SAVINGS_AMOUNT || '25'),
    MIN_SAVINGS_PERCENT: parseFloat(process.env.MIN_SAVINGS_PERCENT || '5'),
    COOLDOWN_HOURS: parseInt(process.env.ALERT_COOLDOWN_HOURS || '12'),
    MAX_ALERTS_PER_DAY: parseInt(process.env.MAX_ALERTS_PER_DAY || '3'),
    USER_OVERRIDES: true // Allow per-user alert settings
  },
  
  // Enhanced monitoring with user control options
  MONITORING: {
    // Global scheduling
    DISPATCH_EVERY_MINUTES: parseInt(process.env.DISPATCH_EVERY_MINUTES || '15'),
    DEFAULT_CHECK_EVERY_MINUTES: parseInt(process.env.DEFAULT_CHECK_EVERY_MINUTES || '360'), // 6 hours
    
    // Per-user customization ranges
    MIN_CHECK_INTERVAL_MINUTES: parseInt(process.env.MIN_CHECK_INTERVAL_MINUTES || '60'), // 1 hour minimum
    MAX_CHECK_INTERVAL_MINUTES: parseInt(process.env.MAX_CHECK_INTERVAL_MINUTES || '1440'), // 24 hours maximum
    
    // Rate limiting and performance
    MAX_CHECKS_PER_DAY: parseInt(process.env.MAX_CHECKS_PER_DAY || '8'),
    STALE_DATA_HOURS: parseInt(process.env.STALE_DATA_HOURS || '48'),
    RATE_LIMIT_DELAY_MS: parseInt(process.env.RATE_LIMIT_DELAY_MS || '2000'),
    CONCURRENT_TRIPS: parseInt(process.env.CONCURRENT_TRIPS || '3'),
    
    // User control features
    ALLOW_MANUAL_TRIGGERS: process.env.ALLOW_MANUAL_TRIGGERS !== 'false',
    MANUAL_TRIGGER_COOLDOWN_MINUTES: parseInt(process.env.MANUAL_TRIGGER_COOLDOWN || '30'),
    PRIORITY_USER_BOOST: process.env.PRIORITY_USER_BOOST === 'true'
  },
  
  // Price check modes and fallbacks
  PRICE_SOURCES: {
    PRIMARY: 'amadeus', // 'amadeus' | 'scraping' | 'mock'
    FALLBACK_TO_MOCK: process.env.ENABLE_MOCK_FALLBACK === 'true',
    FALLBACK_TO_SCRAPING: process.env.ENABLE_SCRAPING_FALLBACK === 'true',
    MOCK_PRICE_VARIANCE: parseFloat(process.env.MOCK_PRICE_VARIANCE || '0.2'), // ±20%
  },
  
  // User experience features
  USER_FEATURES: {
    CUSTOM_CHECK_INTERVALS: process.env.ALLOW_CUSTOM_INTERVALS === 'true',
    PRICE_HISTORY_TRACKING: process.env.TRACK_PRICE_HISTORY !== 'false',
    MANUAL_PRICE_REFRESH: process.env.ALLOW_MANUAL_REFRESH !== 'false',
    SAVINGS_PREDICTIONS: process.env.ENABLE_SAVINGS_PREDICTIONS === 'true'
  },
  
  // Timezone and scheduling
  TIMEZONE: process.env.TZ || 'America/New_York',
  
  // API and webhook settings
  VERCEL: {
    CRON_SECRET: process.env.CRON_SECRET,
    API_URL: process.env.NEXTAUTH_URL || 'https://farelines.com',
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
  },
  
  // Development and testing
  DEVELOPMENT: {
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
    SAVE_DEBUG_FILES: process.env.SAVE_DEBUG_FILES === 'true',
    TEST_MODE: process.env.NODE_ENV === 'test'
  }
};