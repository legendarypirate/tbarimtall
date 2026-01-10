const express = require('express');
const router = express.Router();
const copyrightReportController = require('../controllers/copyrightReportController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');

// Public route - can be used by authenticated or non-authenticated users
// Uses optionalAuthenticate to set req.user if token is present
router.post('/', optionalAuthenticate, copyrightReportController.createCopyrightReport);

// Admin routes - require authentication and admin role
router.get('/', authenticate, authorize('admin'), copyrightReportController.getAllCopyrightReports);
router.put('/:id/approve', authenticate, authorize('admin'), copyrightReportController.approveCopyrightReport);
router.put('/:id/reject', authenticate, authorize('admin'), copyrightReportController.rejectCopyrightReport);

module.exports = router;

