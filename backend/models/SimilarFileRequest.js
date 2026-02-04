const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SimilarFileRequest = sequelize.define('SimilarFileRequest', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who requested similar file'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'Product that user wants similar content for'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Content creator (journalist) who should create similar content'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User description of what similar content they need'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes about the request'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin who processed the request'
  },
  journalistNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Journalist notes about creating the content'
  }
}, {
  tableName: 'similar_file_requests',
  timestamps: true
});

module.exports = SimilarFileRequest;

