const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CopyrightReport = sequelize.define('CopyrightReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID if authenticated, null if not authenticated'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Email from authenticated user or provided by non-authenticated user'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Phone number from non-authenticated user'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Report comment/reason'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  adminComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin comment when approving or rejecting'
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin user ID who processed the report'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the report was processed'
  }
}, {
  tableName: 'copyright_reports',
  timestamps: true
});

module.exports = CopyrightReport;

