const redisClient = require('../config/redis');
const kafkaConfig = require('../config/kafka');

const CACHE_KEY = 'items';

// In-memory array to simulate a database for demonstration purposes
let items = [
  {
    id: '1',
    name: 'AWS EC2 Instance',
    description: 'Virtual server in Amazon\'s Elastic Compute Cloud (EC2)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'AWS S3 Bucket',
    description: 'Simple Storage Service (S3) for internet-scale object storage',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Helper to invalidate Redis cache safely
 */
const invalidateCache = async () => {
  if (redisClient.isOpen) {
    try {
      await redisClient.del(CACHE_KEY);
      console.log(`[Cache]: Invalidated items list in Redis (Key: ${CACHE_KEY})`);
    } catch (err) {
      console.error(`[Cache Error]: Failed to invalidate cache: ${err.message}`);
    }
  }
};

/**
 * Get all items (with Redis Caching)
 */
const getItems = async (req, res) => {
  // 1. Try to fetch from Redis Cache if connected
  if (redisClient.isOpen) {
    try {
      const cachedData = await redisClient.get(CACHE_KEY);
      if (cachedData) {
        console.log(`[Cache]: HIT - Fetching items list from Redis (Key: ${CACHE_KEY})`);
        return res.status(200).json({
          success: true,
          source: 'cache',
          count: JSON.parse(cachedData).length,
          data: JSON.parse(cachedData)
        });
      }
    } catch (err) {
      console.error(`[Cache Error]: Failed to retrieve cache: ${err.message}`);
    }
  }

  // 2. Cache Miss - Fetch from database (in-memory simulation)
  console.log(`[Cache]: MISS - Fetching items list from database`);

  // 3. Set Cache in Redis if connected
  if (redisClient.isOpen) {
    try {
      await redisClient.set(CACHE_KEY, JSON.stringify(items));
      console.log(`[Cache]: Cached items list in Redis (Key: ${CACHE_KEY})`);
    } catch (err) {
      console.error(`[Cache Error]: Failed to set cache: ${err.message}`);
    }
  }

  res.status(200).json({
    success: true,
    source: 'database',
    count: items.length,
    data: items
  });
};

/**
 * Get single item by ID
 */
const getItemById = (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: `Item with id ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: item
  });
};

/**
 * Create a new item (invalidates cache)
 */
const createItem = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a name for the item'
    });
  }

  const newItem = {
    id: (items.length > 0 ? Math.max(...items.map(i => parseInt(i.id))) + 1 : 1).toString(),
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(newItem);

  // Invalidate cache since database state changed
  await invalidateCache();

  // Publish event to Kafka (non-blocking call)
  kafkaConfig.sendEvent('item-events', newItem.id, {
    eventType: 'ITEM_CREATED',
    timestamp: new Date().toISOString(),
    item: newItem
  });

  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: newItem
  });
};

/**
 * Update an existing item (invalidates cache)
 */
const updateItem = async (req, res) => {
  const itemIndex = items.findIndex(i => i.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Item with id ${req.params.id} not found`
    });
  }

  const { name, description } = req.body;

  // Update properties if provided
  if (name !== undefined) items[itemIndex].name = name;
  if (description !== undefined) items[itemIndex].description = description;
  items[itemIndex].updatedAt = new Date().toISOString();

  // Invalidate cache since database state changed
  await invalidateCache();

  res.status(200).json({
    success: true,
    message: 'Item updated successfully',
    data: items[itemIndex]
  });
};

/**
 * Delete an item (invalidates cache)
 */
const deleteItem = async (req, res) => {
  const itemIndex = items.findIndex(i => i.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Item with id ${req.params.id} not found`
    });
  }

  const deletedItem = items.splice(itemIndex, 1)[0];

  // Invalidate cache since database state changed
  await invalidateCache();

  res.status(200).json({
    success: true,
    message: 'Item deleted successfully',
    data: deletedItem
  });
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
