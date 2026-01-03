const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadProduct } = require('../config/multer');

router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
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

