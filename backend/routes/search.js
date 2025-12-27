const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Search is handled by productController.getAllProducts with search query
router.get('/', productController.getAllProducts);

module.exports = router;

