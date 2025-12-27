const { Product, Category, Subcategory, User, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      categoryId,
      subcategoryId,
      search,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'newest'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (minPrice) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    if (minRating) where.rating = { [Op.gte]: parseFloat(minRating) };
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const orderBy = {
      newest: [['createdAt', 'DESC']],
      oldest: [['createdAt', 'ASC']],
      'price-low': [['price', 'ASC']],
      'price-high': [['price', 'DESC']],
      rating: [['rating', 'DESC']],
      downloads: [['downloads', 'DESC']]
    };

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'], required: false },
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ],
      order: orderBy[sortBy] || orderBy.newest,
      limit: parseInt(limit),
      offset
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'], required: false },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar'],
          include: [{
            model: require('../models').Journalist,
            as: 'journalist',
            required: false
          }]
        },
        {
          model: Review,
          as: 'reviews',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment views
    await product.increment('views');

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ],
      order: [['rating', 'DESC'], ['downloads', 'DESC']],
      limit
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      authorId: req.user.id
    };

    const product = await Product.create(productData);

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    res.status(201).json({ product: createdProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is author or admin
    if (product.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await product.update(req.body);

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    res.json({ product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is author or admin
    if (product.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await product.update({ status: 'deleted', isActive: false });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user's products
exports.getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { authorId: req.user.id };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user's statistics
exports.getMyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total products
    const totalProducts = await Product.count({
      where: { authorId: userId }
    });

    // Get total views
    const totalViewsResult = await Product.sum('views', {
      where: { authorId: userId }
    });
    const totalViews = totalViewsResult || 0;

    // Get total downloads
    const totalDownloadsResult = await Product.sum('downloads', {
      where: { authorId: userId }
    });
    const totalDownloads = totalDownloadsResult || 0;

    // Get total earnings (sum of all product earnings)
    // For now, we'll calculate based on downloads * price (assuming 100% earnings)
    // You may need to adjust this based on your actual earnings calculation
    const products = await Product.findAll({
      where: { authorId: userId },
      attributes: ['price', 'downloads']
    });
    
    const totalEarnings = products.reduce((sum, product) => {
      return sum + (product.price * product.downloads);
    }, 0);

    // Get pending earnings (from withdrawal requests)
    const { WithdrawalRequest } = require('../models');
    const pendingWithdrawals = await WithdrawalRequest.sum('amount', {
      where: {
        userId: userId,
        status: 'pending'
      }
    });
    const pendingEarnings = pendingWithdrawals || 0;

    // Get journalist info if exists
    const { Journalist } = require('../models');
    const journalist = await Journalist.findOne({
      where: { userId: userId }
    });

    res.json({
      stats: {
        totalProducts,
        totalViews: parseInt(totalViews),
        totalDownloads: parseInt(totalDownloads),
        totalEarnings: parseFloat(totalEarnings),
        pendingEarnings: parseFloat(pendingEarnings),
        followers: journalist ? journalist.followers : 0,
        rating: journalist ? parseFloat(journalist.rating) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

