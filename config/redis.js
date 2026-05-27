/**
 * Redis client configuration and connection initialization
 */
const redis = require('redis');
const config = require('./environment');

const client = redis.createClient({
  url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
});

// Event listener for errors
client.on('error', (err) => {
  console.error(`[Redis Error]: ${err.message}`);
});

// Event listener for connecting
client.on('connect', () => {
  console.log(`[Redis]: Connecting to server at redis://${config.REDIS_HOST}:${config.REDIS_PORT}...`);
});

// Event listener for ready connection
client.on('ready', () => {
  console.log(`[Redis]: Connection successfully established and ready to use.`);
});

// Connect to Redis server asynchronously
client.connect().catch((err) => {
  console.warn(`[Redis Connection Warn]: Could not connect to Redis server. Backend will operate with in-memory database fallback without caching.`, err.message);
});

module.exports = client;
