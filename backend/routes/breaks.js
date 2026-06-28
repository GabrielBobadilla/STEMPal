const express = require('express');
const router = express.Router();
const breakController = require('../controllers/breakController');
const { authenticate } = require('../middleware/auth');

router.post('/recommend', authenticate, breakController.recommendBreak);
router.get('/', authenticate, breakController.getBreakRecommendations);
router.put('/:id/taken', authenticate, breakController.markBreakTaken);
router.get('/effectiveness', authenticate, breakController.getBreakEffectiveness);

module.exports = router;
