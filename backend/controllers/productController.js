const { Product, Category, Subcategory, User, Review, sequelize } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const archiver = require('archiver');
const { clearCacheByPattern } = require('../middleware/cache');

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

// Helper function to recursively parse JSON strings until we get an array of URLs
function parsePreviewImages(value) {
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
}

// Helper function to sanitize product data and convert image paths
function sanitizeProduct(product) {
  const productData = product.toJSON ? product.toJSON() : product;
  delete productData.filePath; // Remove filePath for security
  
  // Convert image paths to URLs
  if (productData.image) {
    productData.image = convertImagePathToUrl(productData.image);
  }
  
  // Parse and normalize preview images
  const parsedPreviewImages = parsePreviewImages(productData.previewImages);
  // Convert paths to URLs
  productData.previewImages = parsedPreviewImages.map(img => 
    typeof img === 'string' ? convertImagePathToUrl(img) : img
  );
  
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
    const where = { 
      status: 'published' // Only show published products (regardless of isActive status)
    };

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
        where: { 
          uuid: id,
          status: 'published', // Only show published products (consistent with getAllProducts)
          isActive: true // Only show active products
        },
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
      product = await Product.findOne({
        where: {
          id: id,
          status: 'published', // Only show published products (consistent with getAllProducts)
          isActive: true // Only show active products
        },
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

    if (!product) {
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
      where: { 
        isActive: true,
        isUnique: true,
        status: 'published'
      },
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
    // Check membership limits before creating product
    const membershipController = require('./membershipController');
    const canPostResult = await membershipController.canUserPost(req.user.id);
    
    if (!canPostResult.canPost) {
      return res.status(403).json({ 
        error: canPostResult.reason || 'Cannot create product',
        publishedCount: canPostResult.publishedCount,
        maxPosts: canPostResult.maxPosts
      });
    }

    // Handle file uploads
    const productData = {
      ...req.body,
      authorId: req.user.id
    };

    // Helper function to upload file to Cloudinary
    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        // Preserve original filename with extension
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        // Clean filename (remove special characters, keep only alphanumeric, dash, underscore)
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const publicId = `tbarimt/products/${cleanBaseName}_${Date.now()}${ext}`;
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw', // For non-image files (PDF, DOCX, etc.)
            public_id: publicId,
            use_filename: false, // We're setting public_id manually
            unique_filename: false,
            overwrite: false,
            type: 'upload', // Ensure it's an upload type
            access_mode: 'public', // Make file publicly accessible
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              // Add original filename to result for download
              result.original_filename = originalName;
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    };

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

    // Helper function to create ZIP from multiple files
    const createZipFromFiles = (files) => {
      return new Promise((resolve, reject) => {
        const archive = archiver('zip', {
          zlib: { level: 9 } // Maximum compression
        });
        
        const chunks = [];
        
        archive.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        archive.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        archive.on('error', (err) => {
          reject(err);
        });
        
        // Add each file to the ZIP
        files.forEach((file) => {
          archive.append(streamifier.createReadStream(file.buffer), {
            name: file.originalname // Preserve original filename
          });
        });
        
        archive.finalize();
      });
    };

    // Process uploaded files (multer.fields() creates req.files object with arrays)
    if (req.files) {
      // Collect all files and images to compress into ZIP
      const allFilesToZip = [];
      
      // Add files to ZIP
      if (req.files.files && req.files.files.length > 0) {
        allFilesToZip.push(...req.files.files);
      }
      
      // Add images to ZIP (they will be included in the ZIP)
      if (req.files.images && req.files.images.length > 0) {
        allFilesToZip.push(...req.files.images);
      }
      
      // Handle multiple files/images - compress to ZIP and upload to Cloudinary
      if (allFilesToZip.length > 0) {
        try {
          // Create ZIP from all files and images
          const zipBuffer = await createZipFromFiles(allFilesToZip);
          
          // Create a file-like object for Cloudinary upload
          const zipFile = {
            buffer: zipBuffer,
            originalname: `product_files_${Date.now()}.zip`,
            mimetype: 'application/zip',
            size: zipBuffer.length
          };
          
          const cloudinaryResult = await uploadToCloudinary(zipFile);
          // Store URL with ZIP filename in query parameter for proper download
          const downloadUrl = `${cloudinaryResult.secure_url}?filename=${encodeURIComponent(zipFile.originalname)}`;
          productData.fileUrl = downloadUrl; // Downloadable URL with filename
          productData.cloudinaryFileUrl = cloudinaryResult.secure_url; // Base URL without query params
          productData.fileType = 'zip';
          productData.fileSize = `${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`;
          productData.filePath = null; // No longer using local file path
        } catch (uploadError) {
          console.error('Error creating ZIP or uploading to Cloudinary:', uploadError);
          throw new Error('Файлуудыг ZIP болгож upload хийхэд алдаа гарлаа: ' + uploadError.message);
        }
      }
      
      // Handle single product file (fieldname: 'file') - for backward compatibility
      else if (req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        try {
          const cloudinaryResult = await uploadToCloudinary(file);
          // Store URL with original filename in query parameter for proper download
          const originalFilename = file.originalname;
          const downloadUrl = `${cloudinaryResult.secure_url}?filename=${encodeURIComponent(originalFilename)}`;
          productData.fileUrl = downloadUrl; // Downloadable URL with filename
          productData.cloudinaryFileUrl = cloudinaryResult.secure_url; // Base URL without query params
          productData.fileType = file.mimetype || path.extname(file.originalname).slice(1);
          productData.fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
          productData.filePath = null; // No longer using local file path
        } catch (uploadError) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          throw new Error('Файл upload хийхэд алдаа гарлаа: ' + uploadError.message);
        }
      }

      // Handle first image file (fieldname: 'image' or 'images') - upload to Cloudinary as preview
      // This is for the main product image display, separate from ZIP
      if (req.files.images && req.files.images.length > 0) {
        const firstImage = req.files.images[0];
        try {
          const cloudinaryResult = await uploadImageToCloudinary(firstImage);
          productData.image = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          // Don't throw error, just log it - image is already in ZIP
        }
      } else if (req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        try {
          const cloudinaryResult = await uploadImageToCloudinary(imageFile);
          productData.image = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          throw new Error('Зураг upload хийхэд алдаа гарлаа: ' + uploadError.message);
        }
      }
    } else if (req.file) {
      // Fallback for single file upload (if using single() instead of fields())
      if (req.file.fieldname === 'file') {
        try {
          const cloudinaryResult = await uploadToCloudinary(req.file);
          // Store URL with original filename in query parameter for proper download
          const originalFilename = req.file.originalname;
          const downloadUrl = `${cloudinaryResult.secure_url}?filename=${encodeURIComponent(originalFilename)}`;
          productData.fileUrl = downloadUrl;
          productData.cloudinaryFileUrl = cloudinaryResult.secure_url;
          productData.fileType = req.file.mimetype || path.extname(req.file.originalname).slice(1);
          productData.fileSize = `${(req.file.size / 1024 / 1024).toFixed(2)} MB`;
          productData.filePath = null;
        } catch (uploadError) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          throw new Error('Файл upload хийхэд алдаа гарлаа: ' + uploadError.message);
        }
      } else if (req.file.fieldname === 'image') {
        try {
          const cloudinaryResult = await uploadImageToCloudinary(req.file);
          productData.image = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          throw new Error('Зураг upload хийхэд алдаа гарлаа: ' + uploadError.message);
        }
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

    // Parse previewImages using the helper function
    productData.previewImages = parsePreviewImages(productData.previewImages);

    // Convert string numbers to proper types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.categoryId) productData.categoryId = parseInt(productData.categoryId);
    if (productData.subcategoryId) productData.subcategoryId = parseInt(productData.subcategoryId);
    if (productData.pages) productData.pages = parseInt(productData.pages);
    if (productData.isUnique !== undefined) {
      productData.isUnique = productData.isUnique === 'true' || productData.isUnique === true;
    }
    
    // Default status to 'new' and isActive to false for journalist products
    // Admin can later set isActive=true to publish
    if (!productData.status) {
      productData.status = 'new';
    }
    if (productData.isActive === undefined || productData.isActive === null) {
      productData.isActive = false; // Journalist products are not published by default
    }

    const product = await Product.create(productData);

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    // Update user's publishedFileCount if product is published
    if (createdProduct.authorId && createdProduct.status === 'published' && createdProduct.isActive) {
      try {
        const { User } = require('../models');
        const author = await User.findByPk(createdProduct.authorId);
        if (author) {
          const publishedCount = await Product.count({
            where: {
              authorId: author.id,
              status: 'published',
              isActive: true
            }
          });
          await author.update({ publishedFileCount: publishedCount });
        }
      } catch (countError) {
        console.error('Error updating publishedFileCount:', countError);
        // Continue - don't fail the product creation
      }
    }

    // Remove filePath from response for security (don't expose internal paths)
    const responseProduct = createdProduct.toJSON();
    delete responseProduct.filePath;

    // Clear cache for featured products and product lists
    clearCacheByPattern('/products/featured');
    clearCacheByPattern('/products\\?');
    clearCacheByPattern('/journalists/top');

    res.status(201).json({ product: responseProduct });
  } catch (error) {
    // No need to clean up local files since we're using Cloudinary now
    // Cloudinary handles cleanup automatically
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

    // Get old status before update
    const oldStatus = product.status;
    const oldIsActive = product.isActive;
    
    await product.update(req.body);

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author' }
      ]
    });

    // Update user's publishedFileCount if status or isActive changed
    if (updatedProduct.authorId && 
        (oldStatus !== updatedProduct.status || oldIsActive !== updatedProduct.isActive)) {
      try {
        const { User } = require('../models');
        const author = await User.findByPk(updatedProduct.authorId);
        if (author) {
          const publishedCount = await Product.count({
            where: {
              authorId: author.id,
              status: 'published',
              isActive: true
            }
          });
          await author.update({ publishedFileCount: publishedCount });
        }
      } catch (countError) {
        console.error('Error updating publishedFileCount:', countError);
        // Continue - don't fail the product update
      }
    }

    // Sanitize product and convert image paths to URLs
    const productData = sanitizeProduct(updatedProduct);

    // Clear cache for featured products and product lists
    clearCacheByPattern('/products/featured');
    clearCacheByPattern('/products\\?');
    clearCacheByPattern('/journalists/top');

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

    // Clear cache for featured products and product lists
    clearCacheByPattern('/products/featured');
    clearCacheByPattern('/products\\?');
    clearCacheByPattern('/journalists/top');

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

    // Get total earnings from user's point field
    // This field is updated with commission-based earnings (points)
    // at the time of each order completion, taking into account membership percentage
    const user = await User.findByPk(userId, {
      attributes: ['point']
    });
    const totalEarnings = parseFloat(user?.point || 0);

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

    // Check if file is in Cloudinary (fileUrl starts with http/https)
    const fileUrl = product.fileUrl || product.cloudinaryFileUrl;
    const filePath = product.filePath;
    
    if (!fileUrl && !filePath) {
      return res.status(404).json({ error: 'Product file not found' });
    }

    // Mark token as used
    await downloadToken.update({ 
      isUsed: true, 
      usedAt: new Date() 
    });

    // Increment product download count
    await product.increment('downloads');

    // If file is in Cloudinary, fetch and stream with proper headers
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
      
      // Get base Cloudinary URL (remove query params)
      const baseUrl = fileUrl.split('?')[0];
      
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
      
      // Fetch file from Cloudinary and stream to response
      const https = require('https');
      const http = require('http');
      const urlModule = require('url');
      
      const parsedUrl = urlModule.parse(baseUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      client.get(baseUrl, (cloudinaryRes) => {
        // Set proper headers for download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        if (cloudinaryRes.statusCode === 200) {
          cloudinaryRes.pipe(res);
        } else {
          res.status(cloudinaryRes.statusCode).json({ error: 'Failed to fetch file from Cloudinary' });
        }
      }).on('error', (error) => {
        console.error('Error fetching file from Cloudinary:', error);
        res.status(500).json({ error: 'Failed to download file' });
      });
      
      return; // Don't continue to local file handling
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
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
};

