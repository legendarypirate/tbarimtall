const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route - get active memberships (for journalists)
router.get('/', membershipController.getActiveMemberships);

// Authenticated route - get current user's membership info
router.get('/my-membership', authenticate, membershipController.getUserMembership);

module.exports = router;

