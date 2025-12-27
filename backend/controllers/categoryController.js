const { Category, Subcategory, Product } = require('../models');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [{
        model: Subcategory,
        as: 'subcategories',
        where: { isActive: true },
        required: false
      }],
      order: [['id', 'ASC']]
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
      where: { categoryId: id, isActive: true }
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
      where: { categoryId: id, isActive: true },
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

