const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const preferenceController = require('../controllers/preferenceController');

router.post('/', authenticate, preferenceController.savePreferences);
router.get('/', authenticate, preferenceController.getPreferences);
router.get('/check', authenticate, preferenceController.checkPreferences);

module.exports = router;
