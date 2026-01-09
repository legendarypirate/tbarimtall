const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const journalistRoutes = require('./journalists');
const searchRoutes = require('./search');
const adminRoutes = require('./admin');
const withdrawalRoutes = require('./withdrawals');
const bannerRoutes = require('./banners');
const membershipRoutes = require('./memberships');
const qpayRoutes = require('./qpay');
const wishlistRoutes = require('./wishlist');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/journalists', journalistRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/banners', bannerRoutes);
router.use('/memberships', membershipRoutes);
router.use('/qpay', qpayRoutes);
router.use('/wishlist', wishlistRoutes);

module.exports = router;

