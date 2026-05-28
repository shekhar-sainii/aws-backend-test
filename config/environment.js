/**
 * Application environment configuration
 */
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.APP_NAME || 'AWS Deployment Demo API',
  REDIS_HOST: process.env.REDIS_HOST || 'redis-container',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  KAFKA_BOOTSTRAP_SERVERS: process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092',
  IS_K8S: !!process.env.KUBERNETES_SERVICE_HOST
};
