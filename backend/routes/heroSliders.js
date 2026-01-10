const express = require('express');
const router = express.Router();
const heroSliderController = require('../controllers/heroSliderController');

// Public route - get active hero sliders
router.get('/', heroSliderController.getAllHeroSliders);

// Get hero slider by ID
router.get('/:id', heroSliderController.getHeroSliderById);

module.exports = router;

