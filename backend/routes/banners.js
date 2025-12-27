const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// Public route - get active banners
router.get('/', bannerController.getAllBanners);

// Get banner by ID
router.get('/:id', bannerController.getBannerById);

module.exports = router;

