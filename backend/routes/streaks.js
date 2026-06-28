const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');
const { authenticate } = require('../middleware/auth');

router.post('/update', authenticate, streakController.updateStreak);
router.get('/', authenticate, streakController.getStreak);

module.exports = router;
