const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const productsDir = path.join(uploadsDir, 'products');
const imagesDir = path.join(uploadsDir, 'images');

[uploadsDir, productsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for product files (secure, not publicly accessible)
const productFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash-originalname
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

// Storage configuration for images (can be public)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

// File filter for product files
const productFileFilter = (req, file, cb) => {
  // Allow common file types including images
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'application/octet-stream', // For executables and other binary files
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml'
  ];
  
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|txt|exe|dmg|pkg|png|jpg|jpeg|svg)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, 7Z, TXT, EXE, DMG, PKG, PNG, JPG, JPEG, SVG'), false);
  }
};

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer instances
const uploadProductFile = multer({
  storage: productFileStorage,
  fileFilter: productFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for images
  }
});

// Combined upload for product creation (file/files + image/images)
// Using memory storage for Cloudinary uploads
const uploadProduct = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary upload
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file' || file.fieldname === 'files') {
      productFileFilter(req, file, cb);
    } else if (file.fieldname === 'image' || file.fieldname === 'images') {
      imageFilter(req, file, cb);
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB for files
  }
});

module.exports = {
  uploadProductFile,
  uploadImage,
  uploadProduct,
  productsDir,
  imagesDir,
  uploadsDir
};

