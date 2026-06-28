const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard', authenticate, analyticsController.getDashboardData);
router.get('/study-time', authenticate, analyticsController.getStudyTimeTrend);
router.get('/quiz-performance', authenticate, analyticsController.getQuizPerformanceTrend);
router.get('/focus', authenticate, analyticsController.getFocusTrend);
router.get('/streak-growth', authenticate, analyticsController.getStreakGrowth);
router.get('/break-effectiveness', authenticate, analyticsController.getBreakEffectiveness);
router.get('/learning-progress', authenticate, analyticsController.getLearningProgress);
router.get('/metrics', authenticate, analyticsController.getMetrics);

module.exports = router;
