const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Public route - get active FAQs
router.get('/', faqController.getAllFAQs);

// Get FAQ by ID
router.get('/:id', faqController.getFAQById);

module.exports = router;

