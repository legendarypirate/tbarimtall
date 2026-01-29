const { Category, Subcategory, Product } = require('../models');

exports.getAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.findAll({
      where: { isActive: true },
      include: [{
        model: Subcategory,
        as: 'subcategories',
        where: { isActive: true },
        required: false
      }],
      order: [['id', 'ASC']]
    });

    // Filter out generic category names like "Category 37", "Category 40", etc.
    // These are likely subcategories that were incorrectly stored as categories
    const categories = allCategories.filter(cat => {
      const isGenericCategory = /^Category\s+\d+$/i.test(cat.name);
      return !isGenericCategory;
    });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{
        model: Subcategory,
        as: 'subcategories',
        where: { isActive: true },
        required: false
      }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get products count
    const productsCount = await Product.count({
      where: { 
        categoryId: id, 
        status: 'published', // Only count published products
        isActive: true 
      }
    });

    res.json({ category, productsCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where: { 
        categoryId: id, 
        status: 'published', // Only show published products
        isActive: true 
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: require('../models').User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
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

// Get subcategory by ID
exports.getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon']
      }]
    });

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Get products count
    const productsCount = await Product.count({
      where: { 
        subcategoryId: id, 
        status: 'published', // Only count published products
        isActive: true 
      }
    });

    res.json({ subcategory, productsCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get subcategory products
exports.getSubcategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where: { 
        subcategoryId: id, 
        status: 'published', // Only show published products
        isActive: true 
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'], required: false },
        { model: require('../models').User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
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

