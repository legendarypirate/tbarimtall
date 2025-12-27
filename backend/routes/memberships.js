const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

// Public route - get active memberships (for journalists)
router.get('/', membershipController.getActiveMemberships);

module.exports = router;

