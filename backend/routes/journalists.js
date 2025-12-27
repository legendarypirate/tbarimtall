const express = require('express');
const router = express.Router();
const journalistController = require('../controllers/journalistController');

router.get('/top', journalistController.getTopJournalists);
router.get('/:id', journalistController.getJournalistById);

module.exports = router;

