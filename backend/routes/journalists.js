const express = require('express');
const router = express.Router();
const journalistController = require('../controllers/journalistController');
const { cacheMiddleware } = require('../middleware/cache');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Cache top journalists for 2 minutes (frequently accessed on homepage)
router.get('/top', cacheMiddleware(2 * 60 * 1000), journalistController.getTopJournalists);
router.get('/:id', optionalAuthenticate, journalistController.getJournalistById);
router.post('/:id/follow', authenticate, journalistController.followJournalist);
router.delete('/:id/follow', authenticate, journalistController.unfollowJournalist);
router.post('/:id/review', authenticate, journalistController.createJournalistReview);

module.exports = router;

