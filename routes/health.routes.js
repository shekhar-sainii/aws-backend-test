const express = require('express');
const router = express.Router();
const config = require('../config/environment');
const redisClient = require('../config/redis');

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
    redisConnected: redisClient.isOpen
  };

  try {
    res.status(200).json(healthStatus);
  } catch (error) {
    healthStatus.status = 'DOWN';
    res.status(500).json(healthStatus);
  }
});

module.exports = router;
