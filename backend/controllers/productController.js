const { Product, Category, Subcategory, User, Review, sequelize } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function to convert absolute file paths to full API URLs
function convertImagePathToUrl(filePath) {
  if (!filePath) return null;
  
  // If it's already a URL (starts with http:// or https://), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If it's already a relative API path (starts with /api/), return as is
  if (filePath.startsWith('/api/')) {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return `${apiBaseUrl}${filePath}`;
  }
  
  // Check if it's an absolute file system path (contains path.sep or starts with / on Unix or C:\ on Windows)
  const uploadsDir = path.join(__dirname, '../uploads');
  let relativePath;
  
  // Try to get relative path from uploads directory
  try {
    relativePath = path.relative(uploadsDir, filePath);
    // If the relative path goes outside uploads directory, it's not a valid upload path
    if (relativePath.startsWith('..')) {
      // Try to see if it's an absolute path that should be converted
      if (path.isAbsolute(filePath)) {
        // Check if it's within the uploads directory structure
        const normalizedFilePath = path.normalize(filePath);
        const normalizedUploadsDir = path.normalize(uploadsDir);
        if (normalizedFilePath.startsWith(normalizedUploadsDir)) {
          relativePath = path.relative(normalizedUploadsDir, normalizedFilePath);
        } else {
          // Not a valid upload path, return null or original
          return null;
        }
      } else {
        // Not an absolute path and not relative to uploads, might be a relative URL
        return filePath.startsWith('/') ? filePath : `/${filePath}`;
      }
    }
  } catch (error) {
    // If path operations fail, return null
    return null;
  }
  
  // Normalize path separators for URLs
  const urlPath = relativePath.split(path.sep).join('/');
  
  // Return full API URL with base URL
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  return `${apiBaseUrl}/api/uploads/${urlPath}`;
}

// Helper function to sanitize product data and convert image paths
function sanitizeProduct(product) {
  const productData = product.toJSON ? product.toJSON() : product;
  delete productData.filePath; // Remove filePath for security
  
  // Convert image paths to URLs
  if (productData.image) {
    productData.image = convertImagePathToUrl(productData.image);
  }
  
  // Convert preview images paths to URLs
  if (productData.previewImages && Array.isArray(productData.previewImages)) {
    productData.previewImages = productData.previewImages.map(img => 
      typeof img === 'string' ? convertImagePathToUrl(img) : img
    );
  }
  
  return productData;
}

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

    // Sanitize products and convert image paths to URLs
    const sanitizedProducts = rows.map(product => sanitizeProduct(product));

    res.json({
      products: sanitizedProducts,
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

    // Check if it's a UUID format (for frontend product detail view)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let product;
    
    if (uuidRegex.test(id)) {
      // Find by UUID (for frontend display)
      product = await Product.findOne({
        where: { uuid: id },
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
    } else {
      // Find by integer ID
      product = await Product.findByPk(id, {
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
    }

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment views
    await product.increment('views');

    // Sanitize product and convert image paths to URLs
    const productData = sanitizeProduct(product);

    res.json({ product: productData });
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

    // Sanitize products and convert image paths to URLs
    const sanitizedProducts = products.map(product => sanitizeProduct(product));

    res.json({ products: sanitizedProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Handle file uploads
    const productData = {
      ...req.body,
      authorId: req.user.id
    };

    // Process uploaded files (multer.fields() creates req.files object with arrays)
    if (req.files) {
      // Handle product file (fieldname: 'file')
      if (req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        productData.filePath = file.path;
        productData.fileType = file.mimetype || path.extname(file.originalname).slice(1);
        productData.fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        productData.fileUrl = null; // Don't store fileUrl - files are not publicly accessible
      }

      // Handle image file (fieldname: 'image')
      if (req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        productData.image = imageFile.path;
      }
    } else if (req.file) {
      // Fallback for single file upload (if using single() instead of fields())
      if (req.file.fieldname === 'file') {
        productData.filePath = req.file.path;
        productData.fileType = req.file.mimetype || path.extname(req.file.originalname).slice(1);
        productData.fileSize = `${(req.file.size / 1024 / 1024).toFixed(2)} MB`;
        productData.fileUrl = null;
      } else if (req.file.fieldname === 'image') {
        productData.image = req.file.path;
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof productData.tags === 'string') {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        productData.tags = productData.tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }

    if (typeof productData.previewImages === 'string') {
      try {
        productData.previewImages = JSON.parse(productData.previewImages);
      } catch (e) {
        productData.previewImages = [];
      }
    }

    // Convert string numbers to proper types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.categoryId) productData.categoryId = parseInt(productData.categoryId);
    if (productData.subcategoryId) productData.subcategoryId = parseInt(productData.subcategoryId);
    if (productData.pages) productData.pages = parseInt(productData.pages);

    const product = await Product.create(productData);

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    // Remove filePath from response for security (don't expose internal paths)
    const responseProduct = createdProduct.toJSON();
    delete responseProduct.filePath;

    res.status(201).json({ product: responseProduct });
  } catch (error) {
    // Clean up uploaded files if product creation failed
    if (req.files) {
      // Clean up file if uploaded
      if (req.files.file && req.files.file.length > 0 && req.files.file[0].path) {
        try {
          fs.unlinkSync(req.files.file[0].path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      // Clean up image if uploaded
      if (req.files.image && req.files.image.length > 0 && req.files.image[0].path) {
        try {
          fs.unlinkSync(req.files.image[0].path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded image:', unlinkError);
        }
      }
    } else if (req.file && req.file.path) {
      // Fallback for single file upload
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    console.error('Error creating product:', error);
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

    // Sanitize product and convert image paths to URLs
    const productData = sanitizeProduct(updatedProduct);

    res.json({ product: productData });
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

    // Sanitize products and convert image paths to URLs
    const sanitizedProducts = rows.map(product => sanitizeProduct(product));

    res.json({
      products: sanitizedProducts,
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

// Secure download endpoint
exports.downloadProduct = async (req, res) => {
  try {
    const { token } = req.params;
    const { DownloadToken, Product, Order } = require('../models');
    const path = require('path');
    const fs = require('fs');

    // Find the download token
    const downloadToken = await DownloadToken.findOne({
      where: { token },
      include: [
        { model: Product, as: 'product' },
        { model: Order, as: 'order' }
      ]
    });

    if (!downloadToken) {
      return res.status(404).json({ error: 'Download token not found' });
    }

    // Check if token is valid
    if (!downloadToken.isValid()) {
      return res.status(403).json({ 
        error: 'Download token expired or already used',
        expired: new Date() >= downloadToken.expiresAt,
        used: downloadToken.isUsed
      });
    }

    // Get product file path
    const product = downloadToken.product;
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Use filePath if available, otherwise fall back to fileUrl for backward compatibility
    const filePath = product.filePath || product.fileUrl;
    if (!filePath) {
      return res.status(404).json({ error: 'Product file not found' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Mark token as used
    await downloadToken.update({ 
      isUsed: true, 
      usedAt: new Date() 
    });

    // Increment product download count
    await product.increment('downloads');

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
      '.exe': 'application/x-msdownload'
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
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
};

