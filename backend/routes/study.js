const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { authenticate } = require('../middleware/auth');

router.post('/log', authenticate, studyController.logActivity);
router.get('/history', authenticate, studyController.getHistory);
router.get('/today', authenticate, studyController.getTodayStats);
router.get('/weekly', authenticate, studyController.getWeeklyStats);
router.get('/monthly', authenticate, studyController.getMonthlyStats);
router.get('/daily', authenticate, studyController.getDailyStats);
router.get('/total', authenticate, studyController.getTotalStats);

module.exports = router;
