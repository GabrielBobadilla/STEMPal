const express = require('express');
const router = express.Router();
const pomodoroController = require('../controllers/pomodoroController');
const { authenticate } = require('../middleware/auth');

router.post('/sessions', authenticate, pomodoroController.saveSession);
router.get('/sessions', authenticate, pomodoroController.getSessions);
router.get('/adaptive-settings', authenticate, pomodoroController.getAdaptiveSettings);
router.post('/focus-score', authenticate, pomodoroController.saveFocusScore);

module.exports = router;
