const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who added the product to wishlist'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'Product added to wishlist'
  }
}, {
  tableName: 'wishlists',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'productId'],
      name: 'unique_user_product'
    }
  ]
});

module.exports = Wishlist;

