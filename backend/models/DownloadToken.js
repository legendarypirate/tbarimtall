const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const DownloadToken = sequelize.define('DownloadToken', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
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
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'download_tokens',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['orderId']
    },
    {
      fields: ['productId']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Generate a secure random token
DownloadToken.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if token is valid (not expired and not used)
DownloadToken.prototype.isValid = function() {
  return !this.isUsed && new Date() < this.expiresAt;
};

module.exports = DownloadToken;

