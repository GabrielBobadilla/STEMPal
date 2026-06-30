const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multiplayerController = require('../controllers/multiplayerController');

router.post('/create', authenticate, multiplayerController.createRoom);
router.post('/join', authenticate, multiplayerController.joinRoom);
router.get('/room/:room_code', authenticate, multiplayerController.getRoomInfo);
router.get('/history', authenticate, multiplayerController.getQuizHistory);
router.post('/save-result', authenticate, multiplayerController.saveQuizResult);

module.exports = router;