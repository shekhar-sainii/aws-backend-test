const express = require('express');
const router = express.Router();
const config = require('../config/environment');
const redisClient = require('../config/redis');

const os = require('os');
let localVisits = 0;

/**
 * @route   GET /api/info
 * @desc    Welcome / Info endpoint
 */
router.get('/api/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the AWS Deployment Demo API!',
    environment: config.NODE_ENV,
    port: config.PORT,
    timestamp: new Date().toISOString(),
    documentation: 'See README.md for endpoint and deployment details'
  });
});

/**
 * @route   GET /api/load-balancer
 * @desc    Load balancing demo endpoint returning hostname and request count
 */
router.get('/api/load-balancer', async (req, res) => {
  let visits = 0;
  try {
    if (redisClient.isOpen) {
      visits = await redisClient.incr('global_visits');
    } else {
      localVisits++;
      visits = localVisits;
    }
  } catch (err) {
    console.error('Error incrementing global_visits in Redis:', err.message);
    localVisits++;
    visits = localVisits;
  }

  res.status(200).json({
    message: "Load Balancing Working 🚀",
    hostname: os.hostname(),
    visits
  });
});

/**
 * @route   GET /api/kafka-events
 * @desc    Fetch recently consumed Kafka events from Redis
 */
router.get('/api/kafka-events', async (req, res) => {
  try {
    if (redisClient.isOpen) {
      const logs = await redisClient.lRange('kafka_logs', 0, -1);
      const parsedLogs = logs.map(log => JSON.parse(log));
      return res.status(200).json({
        success: true,
        count: parsedLogs.length,
        data: parsedLogs
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'Redis cache offline. Cannot retrieve Kafka events logs.'
      });
    }
  } catch (err) {
    console.error('Error fetching Kafka logs from Redis:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Kafka logs',
      error: err.message
    });
  }
});

/**
 * @route   GET /health
 * @desc    Liveness/readiness health check for AWS Load Balancer
 */
router.get('/health', (req, res) => {
  // Check system health
  const healthStatus = {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    platform: process.platform,
    redisConnected: redisClient.isOpen,
    runningOnK8s: config.IS_K8S,
    commitSha: process.env.COMMIT_SHA || 'local-dev'
  };

  try {
    res.status(200).json(healthStatus);
  } catch (error) {
    healthStatus.status = 'DOWN';
    res.status(500).json(healthStatus);
  }
});

module.exports = router;
