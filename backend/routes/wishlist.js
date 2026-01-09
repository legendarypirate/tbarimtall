const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authenticate);

// Add product to wishlist
router.post('/', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/:productId', wishlistController.removeFromWishlist);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

// Get wishlist status for multiple products
router.post('/status', wishlistController.getWishlistStatus);

module.exports = router;

