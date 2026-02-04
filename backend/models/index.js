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
const FAQ = require('./FAQ');
const RolePermission = require('./RolePermission');
const Membership = require('./Membership');
const DownloadToken = require('./DownloadToken');
const Wishlist = require('./Wishlist');
const CopyrightReport = require('./CopyrightReport');
const HeroSlider = require('./HeroSlider');
const JournalistReview = require('./JournalistReview');
const Follow = require('./Follow');
const SimilarFileRequest = require('./SimilarFileRequest');

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

Product.hasMany(CopyrightReport, { foreignKey: 'productId', as: 'copyrightReports' });
CopyrightReport.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(CopyrightReport, { foreignKey: 'userId', as: 'copyrightReports' });
CopyrightReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CopyrightReport.belongsTo(User, { foreignKey: 'processedBy', as: 'processedByUser' });

// Journalist Review associations
Journalist.hasMany(JournalistReview, { foreignKey: 'journalistId', as: 'reviews' });
JournalistReview.belongsTo(Journalist, { foreignKey: 'journalistId', as: 'journalist' });
JournalistReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(JournalistReview, { foreignKey: 'userId', as: 'journalistReviews' });

// Follow associations
Journalist.hasMany(Follow, { foreignKey: 'journalistId', as: 'follows' });
Follow.belongsTo(Journalist, { foreignKey: 'journalistId', as: 'journalist' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });

// Membership associations
// Note: constraints: false prevents Sequelize from auto-creating FK constraint
// The FK constraint is created manually via SQL migration
User.belongsTo(Membership, { foreignKey: 'membership_type', as: 'membership', constraints: false });
Membership.hasMany(User, { foreignKey: 'membership_type', as: 'users', constraints: false });

// Similar File Request associations
User.hasMany(SimilarFileRequest, { foreignKey: 'userId', as: 'similarFileRequests' });
SimilarFileRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(SimilarFileRequest, { foreignKey: 'productId', as: 'similarFileRequests' });
SimilarFileRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(SimilarFileRequest, { foreignKey: 'authorId', as: 'authorSimilarFileRequests' });
SimilarFileRequest.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
SimilarFileRequest.belongsTo(User, { foreignKey: 'processedBy', as: 'processedByUser' });

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
  FAQ,
  RolePermission,
  Membership,
  DownloadToken,
  Wishlist,
  CopyrightReport,
  HeroSlider,
  JournalistReview,
  Follow,
  SimilarFileRequest
};

