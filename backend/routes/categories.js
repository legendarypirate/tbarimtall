const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { cacheMiddleware } = require('../middleware/cache');

// Cache categories list for 5 minutes (frequently accessed, rarely changes)
router.get('/', cacheMiddleware(5 * 60 * 1000), categoryController.getAllCategories);

// Subcategory routes (must be before /:id to avoid route conflicts)
router.get('/subcategory/:id', cacheMiddleware(5 * 60 * 1000), categoryController.getSubcategoryById);
router.get('/subcategory/:id/products', categoryController.getSubcategoryProducts);

// Category routes
router.get('/:id', cacheMiddleware(5 * 60 * 1000), categoryController.getCategoryById);
router.get('/:id/products', categoryController.getCategoryProducts);

module.exports = router;

