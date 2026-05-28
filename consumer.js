const { Kafka } = require('kafkajs');
const redis = require('redis');
const config = require('./config/environment');

// 1. Initialize Redis Client
const redisClient = redis.createClient({
  url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('[Redis Error]:', err.message));
redisClient.on('connect', () => console.log('[Redis]: Connecting to server...'));
redisClient.on('ready', () => console.log('[Redis]: Connected and ready.'));

// 2. Initialize Kafka Consumer Client
const kafka = new Kafka({
  clientId: 'aws-backend-test-consumer',
  brokers: config.KAFKA_BOOTSTRAP_SERVERS.split(','),
  retry: {
    initialRetryTime: 300,
    retries: 5
  }
});

const consumer = kafka.consumer({
  groupId: 'aws-backend-test-group'
});

const run = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();

    // Connect to Kafka Consumer
    console.log(`[Kafka Consumer]: Connecting to brokers at ${config.KAFKA_BOOTSTRAP_SERVERS}...`);
    await consumer.connect();
    console.log('[Kafka Consumer]: Connection established successfully.');

    // Subscribe to topic
    await consumer.subscribe({
      topic: 'item-events',
      fromBeginning: true
    });
    console.log('[Kafka Consumer]: Subscribed to topic "item-events". Listening for events...');

    // Start consuming
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key ? message.key.toString() : 'N/A';
        const valueStr = message.value ? message.value.toString() : '{}';
        let payload = {};
        try {
          payload = JSON.parse(valueStr);
        } catch (e) {
          payload = { raw: valueStr };
        }

        const logRecord = {
          topic,
          partition,
          offset: message.offset,
          key,
          payload,
          receivedAt: new Date().toISOString()
        };

        console.log(`==================================================`);
        console.log(`[Kafka Consumer]: RECEIVED MESSAGE`);
        console.log(`  Topic:     ${topic}`);
        console.log(`  Partition: ${partition}`);
        console.log(`  Offset:    ${message.offset}`);
        console.log(`  Key:       ${key}`);
        console.log(`  Payload:   `, JSON.stringify(payload, null, 2));
        console.log(`==================================================`);

        // Push log record to Redis list "kafka_logs"
        if (redisClient.isOpen) {
          try {
            await redisClient.lPush('kafka_logs', JSON.stringify(logRecord));
            // Keep only the latest 20 logs in the list to avoid unbound storage growth
            await redisClient.lTrim('kafka_logs', 0, 19);
            console.log('[Redis]: Pushed Kafka event log to list "kafka_logs"');
          } catch (redisErr) {
            console.error('[Redis Error]: Failed to store Kafka log:', redisErr.message);
          }
        }
      }
    });

  } catch (err) {
    console.error('[Kafka Consumer Critical Error]:', err.message);
    // Restart attempt after a delay if connection fails
    setTimeout(() => {
      console.log('Attempting to restart consumer...');
      run();
    }, 10000);
  }
};

// Graceful shutdown
const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down consumer...`);
  try {
    await consumer.disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    console.log('Consumer stopped successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Start the consumer loop
run();
