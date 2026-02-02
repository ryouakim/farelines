// apps/worker/config.js - Centralized configuration for Farelines
require('dotenv').config();

module.exports = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database - Updated for Farelines
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  DB_NAME: process.env.MONGODB_DB || process.env.DB_NAME || 'bearlines',
  TRIPS_COLLECTION: process.env.TRIPS_COLLECTION || 'trips',
  USERS_COLLECTION: process.env.USERS_COLLECTION || 'users',
  
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
  
  // Scraping settings (from your existing config)
  SCRAPING: {
    HEADLESS: process.env.HEADLESS !== 'false',
    TIMEOUT: parseInt(process.env.SCRAPE_TIMEOUT || '60000'),
    RETRY_COUNT: parseInt(process.env.RETRY_COUNT || '3'),
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '5000'),
    RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY || '3000'),
    USER_AGENTS: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ]
  },
  
  // Alert settings
  ALERTS: {
    MIN_SAVINGS_AMOUNT: parseFloat(process.env.MIN_SAVINGS_AMOUNT || '10'),
    MIN_SAVINGS_PERCENT: parseFloat(process.env.MIN_SAVINGS_PERCENT || '2'),
    COOLDOWN_HOURS: parseInt(process.env.ALERT_COOLDOWN_HOURS || '24')
  },
  
  // Monitoring - Updated for per-trip settings
  MONITORING: {
    DISPATCH_EVERY_MINUTES: parseInt(process.env.DISPATCH_EVERY_MINUTES || '5'),
    DEFAULT_CHECK_EVERY_MINUTES: parseInt(process.env.DEFAULT_CHECK_EVERY_MINUTES || '360'), // 6 hours
    MAX_CHECKS_PER_DAY: parseInt(process.env.MAX_CHECKS_PER_DAY || '4'),
    STALE_DATA_HOURS: parseInt(process.env.STALE_DATA_HOURS || '48'),
    RATE_LIMIT_DELAY_MS: parseInt(process.env.RATE_LIMIT_DELAY_MS || '4000')
  },
  
  // Timezone
  TIMEZONE: process.env.TZ || 'America/New_York',
  
  // Vercel/API settings
  VERCEL: {
    CRON_SECRET: process.env.CRON_SECRET,
    API_URL: process.env.NEXTAUTH_URL || 'https://farelines.com'
  }
};
