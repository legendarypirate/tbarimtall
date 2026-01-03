const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for guest orders
    references: {
      model: 'users',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for wallet recharge orders
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'Product ID (null for wallet recharge orders)'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('qpay', 'bank', 'wallet', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  invoiceId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'QPay invoice ID'
  },
  qrImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'QPay QR code image URL or base64'
  },
  qrText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'QPay QR code text for manual scanning'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;

