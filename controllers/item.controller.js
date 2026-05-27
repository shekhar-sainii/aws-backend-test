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
 * Get all items
 */
const getItems = (req, res) => {
  res.status(200).json({
    success: true,
    count: items.length,
    data: items
  });
};

/**
 * Get single item by ID
 */
const getItemById = (req, res, next) => {
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
 * Create a new item
 */
const createItem = (req, res) => {
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

  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: newItem
  });
};

/**
 * Update an existing item
 */
const updateItem = (req, res) => {
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

  res.status(200).json({
    success: true,
    message: 'Item updated successfully',
    data: items[itemIndex]
  });
};

/**
 * Delete an item
 */
const deleteItem = (req, res) => {
  const itemIndex = items.findIndex(i => i.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Item with id ${req.params.id} not found`
    });
  }

  const deletedItem = items.splice(itemIndex, 1)[0];

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
