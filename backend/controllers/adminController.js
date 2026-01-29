const { User, Product, Category, Subcategory, Order, Review, Membership, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

// Helper function to recursively parse JSON strings until we get an array of URLs
const parsePreviewImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    // If it's already an array, flatten any nested stringified arrays
    return value.flatMap(item => {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            return parsePreviewImages(parsed);
          }
          // If parsed is a string (single URL), return it
          return typeof parsed === 'string' ? parsed : item;
        } catch (e) {
          // If it's not JSON, it's probably a URL string
          return item;
        }
      }
      return item;
    }).filter(item => typeof item === 'string' && item.trim() !== '');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsePreviewImages(parsed);
    } catch (e) {
      // If it's not valid JSON, treat it as a single URL
      return value.trim() !== '' ? [value] : [];
    }
  }
  return [];
};
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to calculate user income from completed orders
async function calculateUserIncome(userId) {
  const { Order, Product, sequelize } = require('../models');
  const { QueryTypes } = require('sequelize');
  
  // Use raw query to calculate income from completed orders
  // Sum amounts from distinct orders (group by order id to avoid duplicates)
  const result = await sequelize.query(
    `SELECT COALESCE(SUM(order_amounts.amount), 0) as total
     FROM (
       SELECT DISTINCT o.id, o.amount
       FROM orders o
       INNER JOIN products p ON o."productId" = p.id
       WHERE o.status = 'completed'
       AND p."authorId" = :userId
       AND o."productId" IS NOT NULL
       AND p.id IS NOT NULL
     ) as order_amounts`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT
    }
  );
  
  return parseFloat(result[0]?.total || 0);
}

// Helper function to calculate published file count
async function calculatePublishedFileCount(userId) {
  const { Product } = require('../models');
  
  const count = await Product.count({
    where: {
      authorId: userId,
      status: 'published',
      isActive: true
    }
  });
  
  return count;
}

// Users CRUD
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
        { wallet: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    console.log(`📊 [getAllUsers] Fetching users: page=${page}, limit=${limit}, search=${search}, role=${role}`);
    console.log(`📊 [getAllUsers] WHERE clause:`, JSON.stringify(where, null, 2));

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] }, // This includes all fields except password, including income
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    console.log(`📊 [getAllUsers] Found ${count} total users, returning ${rows.length} users`);

    // Return users with income column included
    const usersWithStats = rows.map((user) => {
      const userData = user.toJSON();
      
      // Ensure income is always included and properly formatted as a number
      // The User model has a getter that converts DECIMAL to float, but we ensure it's a number
      if (userData.income !== null && userData.income !== undefined) {
        userData.income = typeof userData.income === 'string' 
          ? parseFloat(userData.income) 
          : Number(userData.income);
        
        if (isNaN(userData.income)) {
          userData.income = 0;
        }
      } else {
        userData.income = 0;
      }
      
      // Ensure publishedFileCount is a number
      if (userData.publishedFileCount !== null && userData.publishedFileCount !== undefined) {
        userData.publishedFileCount = typeof userData.publishedFileCount === 'string'
          ? parseInt(userData.publishedFileCount, 10)
          : Number(userData.publishedFileCount);
        
        if (isNaN(userData.publishedFileCount)) {
          userData.publishedFileCount = 0;
        }
      } else {
        userData.publishedFileCount = 0;
      }
      
      return userData;
    });

    const response = {
      users: usersWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ [getAllUsers] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate and update income and publishedFileCount
    const currentIncome = await calculateUserIncome(user.id);
    const currentPublishedCount = await calculatePublishedFileCount(user.id);
    
    // Update user record if values have changed
    const storedIncome = parseFloat(user.income || 0);
    const storedPublishedCount = parseInt(user.publishedFileCount || 0);
    const incomeDiff = Math.abs(storedIncome - currentIncome);
    
    if (incomeDiff > 0.01 || storedPublishedCount !== currentPublishedCount) {
      console.log(`[Income Update] User ${user.id}: income ${storedIncome} -> ${currentIncome} (diff: ${incomeDiff}), publishedCount ${storedPublishedCount} -> ${currentPublishedCount}`);
      try {
        // Use raw SQL update to ensure it actually executes
        await sequelize.query(
          `UPDATE users SET income = :income, "publishedFileCount" = :publishedFileCount WHERE id = :userId`,
          {
            replacements: {
              income: currentIncome,
              publishedFileCount: currentPublishedCount,
              userId: user.id
            },
            type: sequelize.QueryTypes.UPDATE
          }
        );
        // Reload to get updated values
        await user.reload();
        console.log(`[Income Update] User ${user.id} updated successfully`);
      } catch (updateError) {
        console.error(`[Income Update] Error updating user ${user.id}:`, updateError);
      }
    }

    const userData = user.toJSON();
    // Ensure income is always a number, not a string (DECIMAL returns as string from Sequelize)
    userData.income = typeof currentIncome === 'number' ? currentIncome : parseFloat(currentIncome) || 0;
    userData.publishedFileCount = typeof currentPublishedCount === 'number' ? currentPublishedCount : parseInt(currentPublishedCount) || 0;

    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const userData = user.toJSON();
    delete userData.password;
    
    // Ensure income is always a number, not a string (DECIMAL returns as string from Sequelize)
    if (userData.income !== undefined) {
      userData.income = typeof userData.income === 'string' 
        ? parseFloat(userData.income) || 0 
        : (typeof userData.income === 'number' ? userData.income : 0);
    }
    
    res.status(201).json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update(req.body);
    const userData = user.toJSON();
    delete userData.password;
    
    // Ensure income is always a number, not a string (DECIMAL returns as string from Sequelize)
    if (userData.income !== undefined) {
      userData.income = typeof userData.income === 'string' 
        ? parseFloat(userData.income) || 0 
        : (typeof userData.income === 'number' ? userData.income : 0);
    }

    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Charge user income (add amount to existing income)
exports.chargeUserIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Validate request
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid user ID is required' 
      });
    }

    if (!amount || amount === '' || amount === null || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount is required' 
      });
    }

    // Parse and validate amount
    const chargeAmount = parseFloat(amount);
    if (isNaN(chargeAmount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be a valid number' 
      });
    }

    if (chargeAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      });
    }

    // Check for maximum amount (optional - add your business logic)
    const MAX_CHARGE_AMOUNT = 1000000000; // 1 billion
    if (chargeAmount > MAX_CHARGE_AMOUNT) {
      return res.status(400).json({ 
        success: false, 
        error: `Amount cannot exceed ${MAX_CHARGE_AMOUNT}` 
      });
    }

    console.log(`Charging user ${id} with amount: ${chargeAmount}`);

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Parse current income with proper type handling
    let currentIncome;
    try {
      currentIncome = typeof user.income === 'string' 
        ? parseFloat(user.income) 
        : Number(user.income);
      
      if (isNaN(currentIncome)) {
        currentIncome = 0;
        console.warn(`User ${id} has invalid income value, resetting to 0`);
      }
    } catch (error) {
      console.error('Error parsing current income:', error);
      currentIncome = 0;
    }

    // Calculate new income
    const newIncome = parseFloat((currentIncome + chargeAmount).toFixed(2));
    
    console.log(`User ${id}: Current income = ${currentIncome}, Charge amount = ${chargeAmount}, New income = ${newIncome}`);

    // Update user income directly (more reliable than User.update for hooks)
    user.income = newIncome;
    await user.save({ fields: ['income'] }); // Only save income field

    // Force reload from database
    await user.reload();

    // Get updated user data
    const userData = user.toJSON();
    
    // Ensure income is a number in the response
    let finalIncome;
    try {
      finalIncome = typeof userData.income === 'string' 
        ? parseFloat(userData.income) 
        : Number(userData.income);
      
      if (isNaN(finalIncome)) {
        finalIncome = newIncome; // Use our calculated value as fallback
      }
    } catch (error) {
      finalIncome = newIncome;
    }

    // Remove sensitive data
    delete userData.password;

    // Create response with consistent number types
    const response = {
      success: true,
      data: {
        user: {
          ...userData,
          income: finalIncome
        },
        transaction: {
          previousIncome: currentIncome,
          chargeAmount: chargeAmount,
          newIncome: finalIncome,
          timestamp: new Date().toISOString()
        }
      },
      message: `Successfully charged ${chargeAmount}₮ to user income. New balance: ${finalIncome}₮`
    };

    // Log successful transaction
    console.log(`✅ Charged ${chargeAmount}₮ to user ${id}. New income: ${finalIncome}₮`);

    res.json(response);

  } catch (error) {
    console.error('Error charging user income:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Handle database connection errors
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

exports.chargeUserPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Validate request
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid user ID is required' 
      });
    }

    if (!amount || amount === '' || amount === null || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount is required' 
      });
    }

    // Parse and validate amount
    const chargeAmount = parseFloat(amount);
    if (isNaN(chargeAmount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be a valid number' 
      });
    }

    if (chargeAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      });
    }

    // Check for maximum amount (optional - add your business logic)
    const MAX_CHARGE_AMOUNT = 1000000000; // 1 billion
    if (chargeAmount > MAX_CHARGE_AMOUNT) {
      return res.status(400).json({ 
        success: false, 
        error: `Amount cannot exceed ${MAX_CHARGE_AMOUNT}` 
      });
    }

    console.log(`Charging user ${id} with points: ${chargeAmount}`);

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Parse current point with proper type handling
    let currentPoint;
    try {
      currentPoint = typeof user.point === 'string' 
        ? parseFloat(user.point) 
        : Number(user.point);
      
      if (isNaN(currentPoint)) {
        currentPoint = 0;
        console.warn(`User ${id} has invalid point value, resetting to 0`);
      }
    } catch (error) {
      console.error('Error parsing current point:', error);
      currentPoint = 0;
    }

    // Calculate new point
    const newPoint = parseFloat((currentPoint + chargeAmount).toFixed(2));
    
    console.log(`User ${id}: Current point = ${currentPoint}, Charge amount = ${chargeAmount}, New point = ${newPoint}`);

    // Update user point directly (more reliable than User.update for hooks)
    user.point = newPoint;
    await user.save({ fields: ['point'] }); // Only save point field

    // Force reload from database
    await user.reload();

    // Get updated user data
    const userData = user.toJSON();
    
    // Ensure point is a number in the response
    let finalPoint;
    try {
      finalPoint = typeof userData.point === 'string' 
        ? parseFloat(userData.point) 
        : Number(userData.point);
      
      if (isNaN(finalPoint)) {
        finalPoint = newPoint; // Use our calculated value as fallback
      }
    } catch (error) {
      finalPoint = newPoint;
    }

    // Remove sensitive data
    delete userData.password;

    // Create response with consistent number types
    const response = {
      success: true,
      data: {
        user: {
          ...userData,
          point: finalPoint
        },
        transaction: {
          previousPoint: currentPoint,
          chargeAmount: chargeAmount,
          newPoint: finalPoint,
          timestamp: new Date().toISOString()
        }
      },
      message: `Successfully charged ${chargeAmount} points to user. New balance: ${finalPoint} points`
    };

    // Log successful transaction
    console.log(`✅ Charged ${chargeAmount} points to user ${id}. New point: ${finalPoint}`);

    res.json(response);

  } catch (error) {
    console.error('Error charging user point:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Handle database connection errors
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isActive: false });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Products CRUD (Admin)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, categoryId, status, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    
    // Filter by status (new, published, cancelled, deleted)
    if (status && ['new', 'published', 'cancelled', 'deleted'].includes(status)) {
      where.status = status;
    }
    
    // Filter by isActive if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    // Legacy support for active/inactive
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Normalize previewImages to ensure they're always arrays
    const normalizedProducts = rows.map(product => {
      const productData = product.toJSON ? product.toJSON() : product;
      productData.previewImages = parsePreviewImages(productData.previewImages);
      // Ensure income is always a number
      productData.income = productData.income != null ? parseFloat(productData.income) || 0 : 0;
      return productData;
    });

    res.json({
      products: normalizedProducts,
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

exports.updateProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Helper function to upload image to Cloudinary
    const uploadImageToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'tbarimt/images',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    };

    // Start with existing product data or request body
    const productData = {};
    
    // Parse FormData fields (they come as strings)
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      // Try to parse JSON fields
      if (key === 'previewImages' || key === 'tags') {
        try {
          productData[key] = JSON.parse(value);
        } catch (e) {
          productData[key] = value;
        }
      } else if (key === 'categoryId' || key === 'subcategoryId' || key === 'authorId') {
        productData[key] = value ? parseInt(value) : null;
      } else if (key === 'price') {
        productData[key] = value ? parseFloat(value) : 0;
      } else if (key === 'pages') {
        productData[key] = value ? parseInt(value) : null;
      } else if (key === 'isDiploma' || key === 'isActive' || key === 'isUnique') {
        productData[key] = value === 'true' || value === true;
      } else {
        productData[key] = value;
      }
    });

    // Use the shared parsePreviewImages helper
    const ensurePreviewImagesArray = parsePreviewImages;

    // Handle previewImages uploads if provided
    if (req.files && req.files.previewImages && req.files.previewImages.length > 0) {
      try {
        const uploadPromises = req.files.previewImages.map(file => uploadImageToCloudinary(file));
        const uploadResults = await Promise.all(uploadPromises);
        const previewImageUrls = uploadResults.map(result => result.secure_url);
        
        // Use existing previewImages from request body if provided (user may have removed some),
        // otherwise use from database. Ensure both are arrays.
        // If productData.previewImages exists, it means user sent the current state (may have removed images)
        // If not, use database value
        const existingPreviewImages = productData.previewImages !== undefined 
          ? ensurePreviewImagesArray(productData.previewImages)
          : ensurePreviewImagesArray(product.previewImages);
        
        // Merge existing images with newly uploaded ones
        productData.previewImages = [...existingPreviewImages, ...previewImageUrls];
      } catch (uploadError) {
        console.error('Error uploading preview images to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Preview images upload хийхэд алдаа гарлаа: ' + uploadError.message });
      }
    } else if (productData.previewImages === undefined) {
      // If previewImages not provided in request, keep existing ones - ensure it's an array
      productData.previewImages = ensurePreviewImagesArray(product.previewImages);
    } else {
      // If previewImages was provided in request body, ensure it's an array
      productData.previewImages = ensurePreviewImagesArray(productData.previewImages);
    }

    await product.update(productData);

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    // Normalize previewImages in response
    const productResponse = updatedProduct.toJSON ? updatedProduct.toJSON() : updatedProduct;
    productResponse.previewImages = ensurePreviewImagesArray(productResponse.previewImages);

    res.json({ product: productResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Instead of destroying, set status to 'deleted'
    await product.update({ status: 'deleted', isActive: false });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Categories CRUD
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Subcategory, as: 'subcategories' }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update(req.body);
    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [
        { model: Subcategory, as: 'subcategories' },
        { model: Product, as: 'products' }
      ]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const productsCount = await Product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. There are ${productsCount} product(s) associated with this category. Please remove or reassign the products first.` 
      });
    }

    // Delete associated subcategories first
    const subcategoriesCount = await Subcategory.count({ where: { categoryId: id } });
    if (subcategoriesCount > 0) {
      await Subcategory.destroy({ where: { categoryId: id } });
    }

    // Actually destroy the category
    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
};

// Subcategories CRUD
exports.getAllSubcategoriesAdmin = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const subcategories = await Subcategory.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ subcategories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { categoryId, name, description, isActive } = req.body;

    // Validate category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = await Subcategory.create({
      categoryId,
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true
    });

    const subcategoryWithCategory = await Subcategory.findByPk(subcategory.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }]
    });

    res.status(201).json({ subcategory: subcategoryWithCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await Subcategory.findByPk(id);

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // If categoryId is being updated, validate it exists
    if (req.body.categoryId) {
      const category = await Category.findByPk(req.body.categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    await subcategory.update(req.body);

    const subcategoryWithCategory = await Subcategory.findByPk(subcategory.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }]
    });

    res.json({ subcategory: subcategoryWithCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await Subcategory.findByPk(id);

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Check if subcategory has products
    const productsCount = await Product.count({ where: { subcategoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete subcategory. There are ${productsCount} product(s) associated with this subcategory. Please remove or reassign the products first.` 
      });
    }

    await subcategory.destroy();
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: error.message || 'Failed to delete subcategory' });
  }
};

// Orders/Payments CRUD
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'username', 'email', 'fullName', 'phone'], 
          required: false 
        },
        { 
          model: Product, 
          as: 'product', 
          attributes: ['id', 'title', 'price', 'authorId'], 
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'fullName', 'email', 'phone', 'membership_type'],
              required: false,
              include: [
                {
                  model: Membership,
                  as: 'membership',
                  attributes: ['id', 'name', 'percentage'],
                  required: false
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate commission amounts for each order
    const ordersWithCommission = rows.map(order => {
      const orderData = order.toJSON();
      const orderAmount = parseFloat(order.amount || 0);
      
      if (orderData.product && orderData.product.author) {
        const membership = orderData.product.author.membership;
        const commissionPercentage = membership ? parseFloat(membership.percentage || 20) : 20;
        
        // Amount goes to journalist (based on membership percentage)
        const journalistAmount = orderAmount * (commissionPercentage / 100);
        
        // Amount goes to tbarimt (remaining amount)
        const tbarimtAmount = orderAmount - journalistAmount;
        
        orderData.commission = {
          journalistAmount: parseFloat(journalistAmount.toFixed(2)),
          tbarimtAmount: parseFloat(tbarimtAmount.toFixed(2)),
          commissionPercentage: commissionPercentage
        };
      } else {
        // No product or author, so no commission split
        orderData.commission = {
          journalistAmount: 0,
          tbarimtAmount: orderAmount,
          commissionPercentage: 0
        };
      }
      
      return orderData;
    });

    res.json({
      orders: ordersWithCommission,
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

exports.getQPayOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      where: { paymentMethod: 'qpay' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'], required: false },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price'], required: false } // Optional for wallet recharge orders
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      orders: rows,
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

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update(req.body);

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Product, as: 'product' }
      ]
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin download endpoint - allows admins to download product files without token
exports.downloadProductFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const path = require('path');
    const fs = require('fs');

    // Find the product
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product file URL
    const fileUrl = product.fileUrl || product.cloudinaryFileUrl;
    const filePath = product.filePath;
    
    if (!fileUrl && !filePath) {
      return res.status(404).json({ error: 'Product file not found' });
    }

    // If file is in Cloudinary, use Cloudinary SDK to download with proper authentication
    if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
      // Extract filename from URL query parameter or use fileType
      let filename = 'download';
      try {
        if (fileUrl.includes('?filename=')) {
          const urlObj = new URL(fileUrl);
          filename = decodeURIComponent(urlObj.searchParams.get('filename') || 'download');
        } else if (product.fileType) {
          filename = `file.${product.fileType}`;
        }
      } catch (e) {
        // If URL parsing fails, use fileType
        if (product.fileType) {
          filename = `file.${product.fileType}`;
        }
      }
      
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}
      let publicId = null;
      try {
        const urlObj = new URL(fileUrl.split('?')[0]);
        const pathParts = urlObj.pathname.split('/');
        // Find the index of 'upload' and get the public_id after version
        const uploadIndex = pathParts.indexOf('upload');
        if (uploadIndex !== -1 && pathParts.length > uploadIndex + 2) {
          // public_id is everything after version (uploadIndex + 2)
          publicId = pathParts.slice(uploadIndex + 2).join('/');
        }
      } catch (e) {
        console.error('Error extracting public_id from URL:', e);
      }
      
      // Determine content type from file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.txt': 'text/plain',
        '.exe': 'application/x-msdownload',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      try {
        // Use Cloudinary SDK to generate a signed URL
        let downloadUrl = fileUrl.split('?')[0];
        
        if (publicId) {
          // Generate signed URL using Cloudinary SDK
          downloadUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
          });
        } else {
          // Fallback: try to extract public_id from the existing URL
          // URL format: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}
          const urlMatch = fileUrl.match(/\/upload\/[^\/]+\/(.+)$/);
          if (urlMatch && urlMatch[1]) {
            const extractedPublicId = urlMatch[1].split('?')[0];
            downloadUrl = cloudinary.url(extractedPublicId, {
              resource_type: 'raw',
              sign_url: true,
              expires_at: Math.floor(Date.now() / 1000) + 3600
            });
          }
        }
        
        // Fetch file from Cloudinary using the signed URL
        const https = require('https');
        const http = require('http');
        const urlModule = require('url');
        
        const parsedUrl = urlModule.parse(downloadUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        client.get(downloadUrl, (cloudinaryRes) => {
          // Set proper headers for download
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          if (cloudinaryRes.statusCode === 200) {
            cloudinaryRes.pipe(res);
          } else if (cloudinaryRes.statusCode === 401) {
            // 401 error usually means Cloudinary security settings restrict ZIP/PDF delivery
            // Provide helpful error message
            res.status(401).json({ 
              error: 'Cloudinary access denied',
              statusCode: 401,
              message: 'ZIP and PDF files are restricted by default in Cloudinary. Please enable "PDF and ZIP files delivery" in your Cloudinary Security settings (Settings > Security > Allow delivery of PDF and ZIP files).',
              helpUrl: 'https://support.cloudinary.com/hc/en-us/articles/360016480179-PDF-or-ZIP-files-appearing-in-Media-Library-but-download-URLs-return-an-error'
            });
          } else {
            res.status(cloudinaryRes.statusCode).json({ 
              error: 'Failed to fetch file from Cloudinary',
              statusCode: cloudinaryRes.statusCode
            });
          }
        }).on('error', (error) => {
          console.error('Error fetching file from Cloudinary:', error);
          res.status(500).json({ error: 'Failed to download file: ' + error.message });
        });
        
        return; // Don't continue to local file handling
      } catch (cloudinaryError) {
        console.error('Cloudinary SDK error:', cloudinaryError);
        // Fallback: try direct HTTP fetch (might fail if resource is private)
        const https = require('https');
        const http = require('http');
        const urlModule = require('url');
        
        const baseUrl = fileUrl.split('?')[0];
        const parsedUrl = urlModule.parse(baseUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        client.get(baseUrl, (cloudinaryRes) => {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          if (cloudinaryRes.statusCode === 200) {
            cloudinaryRes.pipe(res);
          } else {
            res.status(cloudinaryRes.statusCode).json({ 
              error: 'Failed to fetch file from Cloudinary',
              statusCode: cloudinaryRes.statusCode,
              message: 'Resource may be private. Please check Cloudinary settings.'
            });
          }
        }).on('error', (error) => {
          console.error('Error fetching file from Cloudinary:', error);
          res.status(500).json({ error: 'Failed to download file: ' + error.message });
        });
        
        return;
      }
    }

    // Fallback to local file system (for backward compatibility)
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Get file stats for proper headers
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Set appropriate content type
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.txt': 'text/plain',
      '.exe': 'application/x-msdownload',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });
  } catch (error) {
    console.error('Admin download error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get purchase history for a product
exports.getProductPurchaseHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get completed orders for this product
    const { count, rows } = await Order.findAndCountAll({
      where: {
        productId: parseInt(productId),
        status: 'completed'
      },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'username', 'email', 'fullName', 'phone'] 
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      orders: rows,
      product: {
        id: product.id,
        title: product.title,
        totalIncome: parseFloat(product.income || 0)
      },
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

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalJournalists,
      totalProducts,
      totalOrders,
      newOrders,
      activeOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      pendingProducts,
      qpayOrders
    ] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { role: 'journalist', isActive: true } }),
      Product.count({ where: { isActive: true } }),
      Order.count(), // Total orders (all statuses)
      Order.count({ where: { status: 'pending' } }), // New orders (pending)
      Order.count({ where: { status: 'completed' } }), // Active orders (completed)
      Order.count({ where: { status: 'cancelled' } }), // Cancelled orders
      Order.sum('amount', { where: { status: 'completed' } }) || 0,
      Order.count({
        where: {
          status: 'completed',
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Product.count({ where: { isActive: false } }),
      Order.count({ where: { paymentMethod: 'qpay', status: 'completed' } })
    ]);

    // Count registered users (same as totalUsers - users with accounts)
    const registeredUsers = totalUsers;

    // Count guest buyers - each unauthenticated purchase counts as 1
    // Count completed orders where userId is null
    const guestBuyers = await Order.count({
      where: {
        userId: null,
        status: 'completed'
      }
    });

    const todayRevenue = await Order.sum('amount', {
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }) || 0;

    res.json({
      stats: {
        totalUsers,
        registeredUsers,
        guestBuyers,
        totalJournalists,
        totalProducts,
        totalOrders,
        newOrders,
        activeOrders,
        cancelledOrders,
        totalRevenue: parseFloat(totalRevenue) || 0,
        todayRevenue: parseFloat(todayRevenue) || 0,
        todayOrders,
        pendingProducts,
        qpayOrders
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Admin Actions Log
exports.getAdminActionsLog = async (req, res) => {
  try {
    const { Product, Order } = require('../models');
    const { Op } = require('sequelize');
    
    // Get recent product creations (last 30 days)
    const recentProducts = await Product.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
      attributes: ['id', 'title', 'price', 'createdAt', 'updatedAt'],
      include: [{
        model: require('../models').User,
        as: 'author',
        attributes: ['id', 'username', 'fullName']
      }]
    });

    // Get recent price changes (products updated in last 30 days)
    const priceChanges = [];
    for (const product of recentProducts) {
      if (product.updatedAt > product.createdAt) {
        // This product was updated after creation, likely a price change
        priceChanges.push({
          id: product.id,
          title: product.title,
          currentPrice: product.price,
          updatedAt: product.updatedAt
        });
      }
    }

    // Get recent order status changes (last 30 days)
    const recentOrders = await Order.findAll({
      where: {
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        status: {
          [Op.in]: ['processing', 'shipped', 'delivered', 'completed']
        }
      },
      order: [['updatedAt', 'DESC']],
      limit: 50,
      attributes: ['id', 'status', 'amount', 'updatedAt'],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'title']
      }]
    });

    // Format actions log
    const actions = [];
    
    // Add product creations
    recentProducts.forEach(product => {
      actions.push({
        id: `product-${product.id}`,
        action: 'Контент нэмсэн',
        admin: product.author?.fullName || product.author?.username || 'System',
        target: product.title || `Product #${product.id}`,
        timestamp: product.createdAt
      });
    });

    // Add price changes
    priceChanges.forEach(product => {
      actions.push({
        id: `price-${product.id}`,
        action: 'Үнэ өөрчилсөн',
        admin: 'Admin',
        target: product.title || `Product #${product.id}`,
        timestamp: product.updatedAt
      });
    });

    // Add order edits
    recentOrders.forEach(order => {
      actions.push({
        id: `order-${order.id}`,
        action: 'Захиалга зассан',
        admin: 'Admin',
        target: order.product?.title || `Order #${order.id}`,
        status: order.status,
        timestamp: order.updatedAt
      });
    });

    // Sort by timestamp descending
    actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      actions: actions.slice(0, 20) // Return last 20 actions
    });
  } catch (error) {
    console.error('Error fetching admin actions log:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get System Health
exports.getSystemHealth = async (req, res) => {
  try {
    const axios = require('axios');
    const { DownloadToken } = require('../models');
    const { Op } = require('sequelize');

    // Check QPay API status
    let paymentApiStatus = 'unknown';
    let paymentApiMessage = '';
    
    try {
      const QPAY_BASE_URL = process.env.QPAY_BASE_URL || 'https://merchant-sandbox.qpay.mn';
      const QPAY_USERNAME = process.env.QPAY_USERNAME;
      const QPAY_PASSWORD = process.env.QPAY_PASSWORD;

      if (QPAY_USERNAME && QPAY_PASSWORD) {
        // Try to get QPay token (light check)
        const response = await axios.post(
          `${QPAY_BASE_URL}/auth/token`,
          {},
          {
            auth: {
              username: QPAY_USERNAME,
              password: QPAY_PASSWORD
            },
            timeout: 5000 // 5 second timeout
          }
        );

        if (response.data && response.data.access_token) {
          paymentApiStatus = 'healthy';
          paymentApiMessage = 'QPay API is operational';
        } else {
          paymentApiStatus = 'warning';
          paymentApiMessage = 'QPay API responded but no token received';
        }
      } else {
        paymentApiStatus = 'warning';
        paymentApiMessage = 'QPay credentials not configured';
      }
    } catch (error) {
      paymentApiStatus = 'error';
      paymentApiMessage = error.response?.status 
        ? `QPay API error: ${error.response.status}` 
        : `QPay API error: ${error.message}`;
    }

    // Count download errors (expired or used tokens in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const downloadErrorCount = await DownloadToken.count({
      where: {
        [Op.or]: [
          { isUsed: true },
          { expiresAt: { [Op.lt]: new Date() } }
        ],
        updatedAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    res.json({
      health: {
        paymentApi: {
          status: paymentApiStatus,
          message: paymentApiMessage
        },
        downloadErrors: {
          count: downloadErrorCount,
          period: '24 hours'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get income analytics with date filters
exports.getIncomeAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end date
        dateFilter.createdAt[Op.lte] = end;
      }
    }
    
    // Base filter: only completed orders
    const baseFilter = {
      status: 'completed',
      ...dateFilter
    };
    
    // Get subscription income (membership orders)
    const subscriptionOrders = await Order.findAll({
      where: {
        ...baseFilter,
        membershipId: { [Op.ne]: null }
      },
      include: [
        {
          model: Membership,
          as: 'membership',
          required: false,
          attributes: ['id', 'name', 'price']
        },
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Get purchase income (product orders, excluding isUnique payments)
    const purchaseOrders = await Order.findAll({
      where: {
        ...baseFilter,
        productId: { [Op.ne]: null },
        amount: { [Op.ne]: 2000 } // Exclude isUnique payments (2000₮)
      },
      include: [
        {
          model: Product,
          as: 'product',
          required: false,
          attributes: ['id', 'title', 'price'],
          include: [
            {
              model: User,
              as: 'author',
              required: false,
              attributes: ['id', 'username', 'fullName']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Get isUnique income (orders with amount = 2000₮ and productId set)
    const isUniqueOrders = await Order.findAll({
      where: {
        ...baseFilter,
        productId: { [Op.ne]: null },
        amount: 2000
      },
      include: [
        {
          model: Product,
          as: 'product',
          required: false,
          attributes: ['id', 'title', 'price'],
          include: [
            {
              model: User,
              as: 'author',
              required: false,
              attributes: ['id', 'username', 'fullName']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate totals
    const subscriptionTotal = subscriptionOrders.reduce((sum, order) => {
      return sum + parseFloat(order.amount || 0);
    }, 0);
    
    const purchaseTotal = purchaseOrders.reduce((sum, order) => {
      return sum + parseFloat(order.amount || 0);
    }, 0);
    
    const isUniqueTotal = isUniqueOrders.reduce((sum, order) => {
      return sum + parseFloat(order.amount || 0);
    }, 0);
    
    const grandTotal = subscriptionTotal + purchaseTotal + isUniqueTotal;
    
    // Generate daily chart data
    const dailyData = {};
    const allOrders = [
      ...subscriptionOrders.map(o => ({ ...o.toJSON(), type: 'subscription' })),
      ...purchaseOrders.map(o => ({ ...o.toJSON(), type: 'purchase' })),
      ...isUniqueOrders.map(o => ({ ...o.toJSON(), type: 'isUnique' }))
    ];
    
    allOrders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          subscription: 0,
          purchase: 0,
          isUnique: 0,
          total: 0
        };
      }
      const amount = parseFloat(order.amount || 0);
      dailyData[date][order.type] += amount;
      dailyData[date].total += amount;
    });
    
    // Convert to array and sort by date
    const dailyChartData = Object.values(dailyData)
      .map(day => ({
        date: day.date,
        subscription: parseFloat(day.subscription.toFixed(2)),
        purchase: parseFloat(day.purchase.toFixed(2)),
        isUnique: parseFloat(day.isUnique.toFixed(2)),
        total: parseFloat(day.total.toFixed(2))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Format response based on type filter
    let response = {
      summary: {
        subscriptionTotal: parseFloat(subscriptionTotal.toFixed(2)),
        purchaseTotal: parseFloat(purchaseTotal.toFixed(2)),
        isUniqueTotal: parseFloat(isUniqueTotal.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        subscriptionCount: subscriptionOrders.length,
        purchaseCount: purchaseOrders.length,
        isUniqueCount: isUniqueOrders.length
      },
      dailyChart: dailyChartData
    };
    
    if (type === 'isUnique') {
      // Only return isUnique orders
      response.subscriptions = [];
      response.purchases = [];
    } else if (!type || type === 'subscription') {
      response.subscriptions = subscriptionOrders.map(order => ({
        id: order.id,
        amount: parseFloat(order.amount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        membership: order.membership ? {
          id: order.membership.id,
          name: order.membership.name,
          price: parseFloat(order.membership.price)
        } : null,
        user: order.user ? {
          id: order.user.id,
          username: order.user.username,
          fullName: order.user.fullName,
          email: order.user.email
        } : null
      }));
    }
    
    if (type === 'isUnique') {
      // Already handled above
    } else if (!type || type === 'purchase') {
      response.purchases = purchaseOrders.map(order => ({
        id: order.id,
        amount: parseFloat(order.amount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        product: order.product ? {
          id: order.product.id,
          title: order.product.title,
          price: parseFloat(order.product.price),
          author: order.product.author ? {
            id: order.product.author.id,
            username: order.product.author.username,
            fullName: order.product.author.fullName
          } : null
        } : null,
        user: order.user ? {
          id: order.user.id,
          username: order.user.username,
          fullName: order.user.fullName,
          email: order.user.email
        } : null
      }));
    }
    
    if (!type || type === 'isUnique') {
      response.isUnique = isUniqueOrders.map(order => ({
        id: order.id,
        amount: parseFloat(order.amount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        product: order.product ? {
          id: order.product.id,
          title: order.product.title,
          price: parseFloat(order.product.price),
          author: order.product.author ? {
            id: order.product.author.id,
            username: order.product.author.username,
            fullName: order.product.author.fullName
          } : null
        } : null,
        user: order.user ? {
          id: order.user.id,
          username: order.user.username,
          fullName: order.user.fullName,
          email: order.user.email
        } : null
      }));
    }
    
    res.json(response);
  } catch (error) {
    console.error('Income analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

