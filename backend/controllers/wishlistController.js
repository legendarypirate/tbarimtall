const { Wishlist, Product, Category, Subcategory, User } = require('../models');
const { Op } = require('sequelize');

// Helper function to sanitize product (similar to productController)
function sanitizeProduct(product) {
  if (!product) return null;
  
  const productData = product.toJSON ? product.toJSON() : product;
  
  // Convert image path to URL if needed
  if (productData.image && !productData.image.startsWith('http')) {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    if (productData.image.startsWith('/api/')) {
      productData.image = `${apiBaseUrl}${productData.image}`;
    } else if (!productData.image.startsWith('http')) {
      productData.image = `${apiBaseUrl}/api/uploads/${productData.image}`;
    }
  }
  
  return productData;
}

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Handle both UUID and integer ID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let product;
    let productIdInt;

    if (uuidRegex.test(productId)) {
      // Find product by UUID
      product = await Product.findOne({
        where: { uuid: productId }
      });
      if (product) {
        productIdInt = product.id;
      }
    } else {
      // Try as integer ID
      productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
      }
      product = await Product.findByPk(productIdInt);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Only allow adding active products with valid status (new or published) to wishlist
    const validStatuses = ['new', 'published'];
    if (!validStatuses.includes(product.status) || !product.isActive) {
      return res.status(400).json({ error: 'Product is not available for wishlist' });
    }

    // Check if already in wishlist
    const existingWishlist = await Wishlist.findOne({
      where: { userId, productId: productIdInt }
    });

    if (existingWishlist) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId,
      productId: productIdInt
    });

    res.status(201).json({
      message: 'Product added to wishlist',
      wishlist: wishlistItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Handle both UUID and integer ID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let productIdInt;

    if (uuidRegex.test(productId)) {
      // Find product by UUID to get integer ID
      const product = await Product.findOne({
        where: { uuid: productId },
        attributes: ['id']
      });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      productIdInt = product.id;
    } else {
      // Try as integer ID
      productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
      }
    }

    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId: productIdInt }
    });

    if (!wishlistItem) {
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }

    await wishlistItem.destroy();

    res.json({
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Wishlist.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          required: false,
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
            { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'], required: false },
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'fullName', 'avatar']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Filter and sanitize products - only show active products with valid status (new or published)
    const validStatuses = ['new', 'published'];
    const allProducts = rows.map(row => row.product).filter(product => product !== null);
    const products = allProducts
      .filter(product => validStatuses.includes(product.status) && product.isActive === true)
      .map(product => sanitizeProduct(product));
    
    // Log for debugging
    if (allProducts.length > 0 && products.length === 0) {
      console.log(`Wishlist: Found ${allProducts.length} wishlist items, but all were filtered out (invalid status or inactive)`);
      console.log('Sample product statuses:', allProducts.slice(0, 3).map(p => ({ id: p.id, status: p.status, isActive: p.isActive })));
    }
    
    // Update count to reflect filtered products
    const filteredCount = products.length;

    res.json({
      products,
      pagination: {
        total: filteredCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Handle both UUID and integer ID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let productIdInt;

    if (uuidRegex.test(productId)) {
      // Find product by UUID to get integer ID
      const product = await Product.findOne({
        where: { uuid: productId },
        attributes: ['id']
      });
      if (!product) {
        return res.json({ isInWishlist: false });
      }
      productIdInt = product.id;
    } else {
      // Try as integer ID
      productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.json({ isInWishlist: false });
      }
    }

    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId: productIdInt }
    });

    res.json({
      isInWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get wishlist status for multiple products
exports.getWishlistStatus = async (req, res) => {
  try {
    const { productIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const wishlistItems = await Wishlist.findAll({
      where: {
        userId,
        productId: { [Op.in]: productIds }
      },
      attributes: ['productId']
    });

    const wishlistProductIds = wishlistItems.map(item => item.productId);

    const statusMap = {};
    productIds.forEach(productId => {
      statusMap[productId] = wishlistProductIds.includes(parseInt(productId));
    });

    res.json({
      status: statusMap
    });
  } catch (error) {
    console.error('Error getting wishlist status:', error);
    res.status(500).json({ error: error.message });
  }
};

