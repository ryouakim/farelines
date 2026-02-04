// apps/worker/cronService.js
// Enhanced scheduler with Amadeus API, user control, and manual triggers

require('dotenv').config({ path: '../../.env.local' });

const cron = require('node-cron');
const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config');
const logger = require('./logger');
const { runOnce, checkTrip, connectDB } = require('./fareMonitor');

class FarelinesCronService {
  constructor() {
    this.db = null;
    this.client = null;
    this.isRunning = false;
    this.activeJobs = new Set();
    this.lastManualTrigger = new Map(); // user -> timestamp
  }

  async initialize() {
    if (!config.MONGO_URI) {
      throw new Error('MONGO_URI is not configured');
    }

    this.client = new MongoClient(config.MONGO_URI);
    await this.client.connect();
    this.db = this.client.db(config.DB_NAME);
    
    logger.info('CronService connected to MongoDB', { db: config.DB_NAME });

    // Create indexes for better performance
    await this.createIndexes();
  }

  async createIndexes() {
    try {
      // Index for due trips query
      await this.db.collection(config.TRIPS_COLLECTION).createIndex({
        checkEnabled: 1,
        nextCheckAt: 1,
        'flights.date': 1
      });

      // Index for manual jobs
      await this.db.collection(config.JOBS_COLLECTION).createIndex({
        status: 1,
        priority: -1,
        createdAt: 1
      });

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.warn('Failed to create indexes', { error: error.message });
    }
  }

  // Enhanced trip due logic with user preferences
  async findDueTrips() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const query = {
      // Basic trip requirements
      status: { $ne: 'inactive' },
      checkEnabled: { $ne: false },
      
      // Must have flight data (not Google URL dependent)
      flights: { $exists: true, $not: { $size: 0 } },
      
      // Future flights only
      'flights.0.date': { $gte: today },
      
      // Due for checking
      $or: [
        { nextCheckAt: { $exists: false } },
        { nextCheckAt: null },
        { nextCheckAt: { $lte: now } }
      ]
    };

    const trips = await this.db.collection(config.TRIPS_COLLECTION)
      .find(query)
      .sort({ 
        priority: -1, // User-defined priority
        nextCheckAt: 1, // Oldest due first
        lastCheckedAt: 1 // Never checked first
      })
      .limit(config.MONITORING.CONCURRENT_TRIPS * 2) // Allow some buffer
      .toArray();

    return trips;
  }

  // Process manual trigger jobs
  async processManualJobs() {
    const jobs = await this.db.collection(config.JOBS_COLLECTION)
      .find({
        status: 'pending',
        type: { $in: ['manual_check', 'user_trigger'] }
      })
      .sort({ priority: -1, createdAt: 1 })
      .limit(3)
      .toArray();

    for (const job of jobs) {
      try {
        // Mark job as processing
        await this.db.collection(config.JOBS_COLLECTION).updateOne(
          { _id: job._id },
          { 
            $set: { 
              status: 'processing',
              startedAt: new Date()
            }
          }
        );

        const result = await this.executeManualJob(job);

        // Mark job as completed
        await this.db.collection(config.JOBS_COLLECTION).updateOne(
          { _id: job._id },
          {
            $set: {
              status: 'completed',
              completedAt: new Date(),
              result: result
            }
          }
        );

        logger.info('Manual job completed', { 
          jobId: job._id,
          type: job.type,
          userEmail: job.userEmail
        });

      } catch (error) {
        // Mark job as failed
        await this.db.collection(config.JOBS_COLLECTION).updateOne(
          { _id: job._id },
          {
            $set: {
              status: 'failed',
              failedAt: new Date(),
              error: error.message
            }
          }
        );

        logger.error('Manual job failed', {
          jobId: job._id,
          error: error.message
        });
      }
    }
  }

  async executeManualJob(job) {
    switch (job.type) {
      case 'manual_check':
        // Single trip check
        if (job.tripId) {
          const trip = await this.db.collection(config.TRIPS_COLLECTION)
            .findOne({ _id: new ObjectId(job.tripId) });
          
          if (trip) {
            return await checkTrip(this.db, trip);
          }
        }
        break;

      case 'user_trigger':
        // Check all user's trips
        if (job.userEmail) {
          const trips = await this.db.collection(config.TRIPS_COLLECTION)
            .find({
              userEmail: job.userEmail,
              status: { $ne: 'inactive' },
              flights: { $exists: true, $not: { $size: 0 } }
            })
            .toArray();

          const results = [];
          for (const trip of trips) {
            try {
              const result = await checkTrip(this.db, trip);
              results.push({ tripId: trip._id, success: true, result });
              
              // Rate limiting
              if (config.MONITORING.RATE_LIMIT_DELAY_MS > 0) {
                await this.wait(config.MONITORING.RATE_LIMIT_DELAY_MS);
              }
            } catch (error) {
              results.push({ tripId: trip._id, success: false, error: error.message });
            }
          }
          return { total: trips.length, results };
        }
        break;
    }

    throw new Error(`Unknown job type: ${job.type}`);
  }

  // Main dispatcher - runs due trips
  async runDueTrips() {
    if (this.activeJobs.size >= config.MONITORING.CONCURRENT_TRIPS) {
      logger.debug('Concurrent trip limit reached, skipping dispatch');
      return;
    }

    const dueTrips = await this.findDueTrips();
    
    if (!dueTrips.length) {
      logger.debug('No trips due for checking');
      return;
    }

    logger.info(`Found ${dueTrips.length} trips due for checking`);

    let processed = 0;
    const maxProcess = config.MONITORING.CONCURRENT_TRIPS - this.activeJobs.size;

    for (const trip of dueTrips.slice(0, maxProcess)) {
      const jobId = `${trip._id}-${Date.now()}`;
      this.activeJobs.add(jobId);

      // Process trip asynchronously
      this.processTripCheck(trip, jobId)
        .catch(error => {
          logger.error('Trip processing failed', {
            tripId: trip._id,
            error: error.message
          });
        })
        .finally(() => {
          this.activeJobs.delete(jobId);
        });

      processed++;
    }

    logger.info(`Dispatched ${processed} trip checks`);
  }

  async processTripCheck(trip, jobId) {
    try {
      logger.debug('Processing trip check', { tripId: trip._id, jobId });

      // Execute the price check
      const result = await checkTrip(this.db, trip);

      // Calculate next check time based on user preferences or defaults
      const userInterval = trip.checkEveryMinutes || 
                          trip.userPreferences?.checkInterval ||
                          config.MONITORING.DEFAULT_CHECK_EVERY_MINUTES;
      
      // Clamp to allowed range
      const intervalMinutes = Math.max(
        config.MONITORING.MIN_CHECK_INTERVAL_MINUTES,
        Math.min(config.MONITORING.MAX_CHECK_INTERVAL_MINUTES, userInterval)
      );

      const nextCheckAt = new Date(Date.now() + intervalMinutes * 60 * 1000);

      // Update trip with next check time
      await this.db.collection(config.TRIPS_COLLECTION).updateOne(
        { _id: trip._id },
        { 
          $set: { 
            nextCheckAt,
            lastSuccessfulCheck: new Date(),
            checkInterval: intervalMinutes
          }
        }
      );

      logger.debug('Trip check completed', {
        tripId: trip._id,
        nextCheck: nextCheckAt.toISOString(),
        intervalMinutes
      });

      return result;

    } catch (error) {
      logger.error('Trip check failed', {
        tripId: trip._id,
        error: error.message
      });

      // Exponential backoff on failure
      const backoffMinutes = Math.min(120, 30 * Math.pow(2, trip.failureCount || 0));
      const nextCheckAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.db.collection(config.TRIPS_COLLECTION).updateOne(
        { _id: trip._id },
        { 
          $set: { 
            nextCheckAt,
            lastCheckError: error.message,
            lastCheckErrorAt: new Date()
          },
          $inc: { failureCount: 1 }
        }
      );

      throw error;
    }
  }

  // Public API: Queue manual job
  async queueManualJob(type, params) {
    if (!config.MONITORING.ALLOW_MANUAL_TRIGGERS) {
      throw new Error('Manual triggers are disabled');
    }

    // Check cooldown for user triggers
    if (type === 'user_trigger' && params.userEmail) {
      const lastTrigger = this.lastManualTrigger.get(params.userEmail);
      const cooldownMs = config.MONITORING.MANUAL_TRIGGER_COOLDOWN_MINUTES * 60 * 1000;
      
      if (lastTrigger && Date.now() - lastTrigger < cooldownMs) {
        const waitMinutes = Math.ceil((cooldownMs - (Date.now() - lastTrigger)) / 60000);
        throw new Error(`Please wait ${waitMinutes} minutes before triggering another check`);
      }
      
      this.lastManualTrigger.set(params.userEmail, Date.now());
    }

    const job = {
      type,
      status: 'pending',
      priority: type === 'user_trigger' ? 10 : 5,
      createdAt: new Date(),
      ...params
    };

    const result = await this.db.collection(config.JOBS_COLLECTION).insertOne(job);
    
    logger.info('Manual job queued', { 
      jobId: result.insertedId,
      type,
      userEmail: params.userEmail
    });

    return result.insertedId;
  }

  // Start the cron scheduler
  async start() {
    if (this.isRunning) {
      logger.warn('CronService is already running');
      return;
    }

    await this.initialize();

    // Initial cleanup and warm-up
    await this.cleanupOldJobs();
    
    // Optional: Run initial sweep
    if (config.DEVELOPMENT.DEBUG_MODE) {
      logger.info('Running initial price check sweep...');
      try {
        await runOnce();
      } catch (error) {
        logger.warn('Initial sweep failed', { error: error.message });
      }
    }

    // Main dispatcher - every N minutes
    const dispatchInterval = Math.max(1, Math.min(30, config.MONITORING.DISPATCH_EVERY_MINUTES));
    const cronExpr = `*/${dispatchInterval} * * * *`;

    logger.info('Starting cron scheduler', {
      expression: cronExpr,
      timezone: config.TIMEZONE,
      dispatchInterval
    });

    cron.schedule(cronExpr, async () => {
      try {
        // Process manual jobs first (higher priority)
        await this.processManualJobs();
        
        // Then process scheduled trips
        await this.runDueTrips();
        
      } catch (error) {
        logger.error('Cron tick failed', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: config.TIMEZONE
    });

    // Cleanup job - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldJobs();
        await this.optimizeDatabase();
      } catch (error) {
        logger.error('Cleanup job failed', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: config.TIMEZONE
    });

    this.isRunning = true;
    logger.info('CronService started successfully');

    // Setup graceful shutdown
    this.setupShutdownHandlers();
  }

  async cleanupOldJobs() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await this.db.collection(config.JOBS_COLLECTION).deleteMany({
      $or: [
        { status: 'completed', completedAt: { $lt: sevenDaysAgo } },
        { status: 'failed', failedAt: { $lt: sevenDaysAgo } }
      ]
    });

    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} old jobs`);
    }
  }

  async optimizeDatabase() {
    try {
      // Reset failure counts for old errors
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await this.db.collection(config.TRIPS_COLLECTION).updateMany(
        { lastCheckErrorAt: { $lt: thirtyDaysAgo } },
        { $unset: { failureCount: 1, lastCheckError: 1, lastCheckErrorAt: 1 } }
      );

      logger.info('Database optimization completed');
    } catch (error) {
      logger.error('Database optimization failed', { error: error.message });
    }
  }

  setupShutdownHandlers() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for active jobs to complete (max 30 seconds)
      const maxWait = 30000;
      const start = Date.now();
      
      while (this.activeJobs.size > 0 && Date.now() - start < maxWait) {
        logger.info(`Waiting for ${this.activeJobs.size} active jobs to complete...`);
        await this.wait(1000);
      }

      if (this.activeJobs.size > 0) {
        logger.warn(`Force shutdown with ${this.activeJobs.size} jobs still active`);
      }

      if (this.client) {
        await this.client.close();
      }

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      lastManualTriggers: Object.fromEntries(this.lastManualTrigger)
    };
  }
}

// Singleton instance
const cronService = new FarelinesCronService();

// If invoked directly, start the service
if (require.main === module) {
  cronService.start().catch(error => {
    logger.error('Failed to start CronService', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  cronService,
  FarelinesCronService
};