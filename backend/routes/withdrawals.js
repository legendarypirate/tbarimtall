const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate, authorize } = require('../middleware/auth');

// Journalist routes - require authentication
router.post('/', authenticate, withdrawalController.createWithdrawalRequest);
router.get('/my-requests', authenticate, withdrawalController.getUserWithdrawalRequests);

// Admin routes - require authentication and admin role
// Note: Admin GET / must come before /:id to avoid route conflicts
router.get('/', authenticate, authorize('admin'), withdrawalController.getAllWithdrawalRequests);
router.put('/:id/status', authenticate, authorize('admin'), withdrawalController.updateWithdrawalRequestStatus);

// Get withdrawal by ID - must come after specific routes
router.get('/:id', authenticate, withdrawalController.getWithdrawalRequestById);

module.exports = router;

