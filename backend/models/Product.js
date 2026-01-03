const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  subcategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subcategories',
      key: 'id'
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  previewImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Cloudinary file URL (downloadable)'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Server-side file path (deprecated, use fileUrl for Cloudinary)'
  },
  cloudinaryFileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Cloudinary file URL for downloadable files'
  },
  isUnique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Unique product flag - journalist pays 2000₮ when admin sets this'
  },
  fileType: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  pages: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  downloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  income: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total income from product sales'
  },
  isDiploma: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('new', 'published', 'cancelled', 'deleted'),
    defaultValue: 'new',
    allowNull: false
  }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;

