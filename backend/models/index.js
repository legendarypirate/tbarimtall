const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Product = require('./Product');
const Journalist = require('./Journalist');
const Order = require('./Order');
const Review = require('./Review');
const WithdrawalRequest = require('./WithdrawalRequest');
const Banner = require('./Banner');
const RolePermission = require('./RolePermission');
const Membership = require('./Membership');
const DownloadToken = require('./DownloadToken');
const Wishlist = require('./Wishlist');

// Define associations
User.hasMany(Product, { foreignKey: 'authorId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Subcategory, { foreignKey: 'categoryId', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Subcategory.hasMany(Product, { foreignKey: 'subcategoryId', as: 'products' });
Product.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' });

Journalist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Journalist, { foreignKey: 'userId', as: 'journalist' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.belongsTo(Membership, { foreignKey: 'membershipId', as: 'membership' });

User.hasMany(WithdrawalRequest, { foreignKey: 'userId', as: 'withdrawalRequests' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'processedBy', as: 'processedByUser' });

Order.hasMany(DownloadToken, { foreignKey: 'orderId', as: 'downloadTokens' });
DownloadToken.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
DownloadToken.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
DownloadToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlists' });
Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Wishlist, { foreignKey: 'productId', as: 'wishlists' });
Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Category,
  Subcategory,
  Product,
  Journalist,
  Order,
  Review,
  WithdrawalRequest,
  Banner,
  RolePermission,
  Membership,
  DownloadToken,
  Wishlist
};

