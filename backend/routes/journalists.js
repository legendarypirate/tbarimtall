const express = require('express');
const router = express.Router();
const journalistController = require('../controllers/journalistController');
const { cacheMiddleware } = require('../middleware/cache');

// Cache top journalists for 2 minutes (frequently accessed on homepage)
router.get('/top', cacheMiddleware(2 * 60 * 1000), journalistController.getTopJournalists);
router.get('/:id', journalistController.getJournalistById);

module.exports = router;

