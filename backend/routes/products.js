const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadProduct } = require('../config/multer');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', productController.getAllProducts);
// Cache featured products for 2 minutes (frequently accessed on homepage)
router.get('/featured', cacheMiddleware(2 * 60 * 1000), productController.getFeaturedProducts);
router.get('/recent', cacheMiddleware(2 * 60 * 1000), productController.getRecentProducts);
router.get('/recommended', productController.getRecommendedProducts);
router.get('/my-products', authenticate, productController.getMyProducts);
router.get('/my-statistics', authenticate, productController.getMyStatistics);
router.get('/download/:token', productController.downloadProduct);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, authorize('journalist', 'admin'), uploadProduct.fields([
  { name: 'file', maxCount: 1 }, // For backward compatibility
  { name: 'files', maxCount: 50 }, // Multiple files (will be compressed to ZIP)
  { name: 'image', maxCount: 1 }, // For backward compatibility
  { name: 'images', maxCount: 50 } // Multiple images (will be included in ZIP)
]), productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;

