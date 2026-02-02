// apps/worker/logger.js
const config = require('./config');

const logger = {
  info: (message, meta) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message, meta) => {
    if (config.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

module.exports = logger;