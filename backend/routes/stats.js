const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public endpoint - no auth
router.get('/', adminController.getPublicStats);

module.exports = router;
