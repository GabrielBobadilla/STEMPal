const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/auth');

router.get('/leaderboard', authenticate, gamificationController.getLeaderboard);
router.get('/ranking', authenticate, gamificationController.getUserRanking);
router.get('/level', authenticate, gamificationController.getLevelInfo);
router.get('/xp-history', authenticate, gamificationController.getXpHistory);
router.post('/check-level-up', authenticate, gamificationController.checkLevelUp);

module.exports = router;
