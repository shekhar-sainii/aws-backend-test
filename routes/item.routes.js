const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');

// Item CRUD routes
router.route('/')
  .get(itemController.getItems)
  .post(itemController.createItem);

router.route('/:id')
  .get(itemController.getItemById)
  .put(itemController.updateItem)
  .delete(itemController.deleteItem);

module.exports = router;
