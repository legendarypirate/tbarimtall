const express = require('express');
const router = express.Router();
const similarFileRequestController = require('../controllers/similarFileRequestController');
const { authenticate, authorize } = require('../middleware/auth');

// User routes - require authentication
router.post('/', authenticate, similarFileRequestController.createSimilarFileRequest);
router.get('/my-requests', authenticate, similarFileRequestController.getUserSimilarFileRequests);

// Journalist routes - require authentication
router.get('/journalist/requests', authenticate, similarFileRequestController.getJournalistSimilarFileRequests);
router.put('/journalist/:id/complete', authenticate, similarFileRequestController.completeSimilarFileRequest);

// Admin routes - require authentication and admin role
router.get('/admin/all', authenticate, authorize('admin'), similarFileRequestController.getAllSimilarFileRequests);
router.get('/admin/:id', authenticate, authorize('admin'), similarFileRequestController.getSimilarFileRequestById);
router.put('/admin/:id/approve', authenticate, authorize('admin'), similarFileRequestController.approveSimilarFileRequest);
router.put('/admin/:id/reject', authenticate, authorize('admin'), similarFileRequestController.rejectSimilarFileRequest);

module.exports = router;

