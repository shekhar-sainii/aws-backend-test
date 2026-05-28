const { Kafka, Partitioners } = require('kafkajs');
const config = require('./environment');

const kafka = new Kafka({
  clientId: 'aws-backend-test-producer',
  brokers: config.KAFKA_BOOTSTRAP_SERVERS.split(','),
  retry: {
    initialRetryTime: 300,
    retries: 5
  }
});

// Using LegacyPartitioner to ensure backward compatibility and prevent partitioner warnings
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

let isProducerConnected = false;

const connectProducer = async () => {
  if (isProducerConnected) return producer;
  try {
    console.log(`[Kafka Producer]: Connecting to brokers at ${config.KAFKA_BOOTSTRAP_SERVERS}...`);
    await producer.connect();
    isProducerConnected = true;
    console.log('[Kafka Producer]: Connection established successfully.');
    return producer;
  } catch (err) {
    console.error('[Kafka Producer Error]: Failed to connect to Kafka broker:', err.message);
    throw err;
  }
};

const disconnectProducer = async () => {
  if (!isProducerConnected) return;
  try {
    await producer.disconnect();
    isProducerConnected = false;
    console.log('[Kafka Producer]: Disconnected successfully.');
  } catch (err) {
    console.error('[Kafka Producer Error]: Error while disconnecting:', err.message);
  }
};

/**
 * Publishes an event to a Kafka topic
 * @param {string} topic - The target topic name
 * @param {string|number} key - Message routing key
 * @param {object} payload - Message payload object
 */
const sendEvent = async (topic, key, payload) => {
  try {
    const activeProducer = await connectProducer();
    const message = {
      key: String(key),
      value: JSON.stringify(payload)
    };
    
    console.log(`[Kafka Producer]: Publishing message to topic "${topic}" (key: ${key})...`);
    const recordMetadata = await activeProducer.send({
      topic,
      messages: [message]
    });
    console.log(`[Kafka Producer]: Message published successfully. Partition: ${recordMetadata[0].partition}, Offset: ${recordMetadata[0].baseOffset}`);
    return recordMetadata;
  } catch (err) {
    console.error(`[Kafka Producer Error]: Failed to send event to topic "${topic}":`, err.message);
    // Non-blocking fallback so API request doesn't fail if Kafka is down
    return null;
  }
};

module.exports = {
  kafka,
  connectProducer,
  disconnectProducer,
  sendEvent
};
