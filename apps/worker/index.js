// apps/worker/index.js
// Entry point for running the worker

require('dotenv').config({ path: '../../.env.local' });
const { runWorker } = require('./fareMonitor');

// For Vercel Cron Jobs - export as serverless function
module.exports = async (req, res) => {
  console.log('Worker triggered via HTTP');
  
  // Verify cron secret if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await runWorker();
    res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: 'Worker cycle completed'
    });
  } catch (error) {
    console.error('Worker error:', error);
    res.status(500).json({ 
      error: 'Worker failed', 
      message: error.message 
    });
  }
};

// For local development - run as standalone
if (require.main === module) {
  const { startWorker } = require('./fareMonitor');
  startWorker().catch(console.error);
}
