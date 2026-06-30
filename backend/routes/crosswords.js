const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const crosswordController = require('../controllers/crosswordController');

router.post('/save', authenticate, crosswordController.savePuzzleResult);
router.get('/history', authenticate, crosswordController.getPuzzleHistory);
router.get('/stats', authenticate, crosswordController.getPuzzleStats);

module.exports = router;