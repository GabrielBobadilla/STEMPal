const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, quizController.generateQuiz);
router.post('/submit', authenticate, quizController.submitQuiz);
router.get('/', authenticate, quizController.getQuizzes);
router.get('/stats', authenticate, quizController.getQuizStats);
router.get('/weak-topics', authenticate, quizController.getWeakTopics);
router.post('/adaptive', authenticate, quizController.generateAdaptiveQuiz);
router.get('/:id', authenticate, quizController.getQuiz);

module.exports = router;
