const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, flashcardController.generateFlashcards);
router.post('/', authenticate, flashcardController.createFlashcard);
router.get('/', authenticate, flashcardController.getFlashcards);
router.get('/due', authenticate, flashcardController.getFlashcardsDue);
router.get('/stats', authenticate, flashcardController.getFlashcardStats);
router.get('/:id', authenticate, flashcardController.getFlashcard);
router.put('/:id', authenticate, flashcardController.updateFlashcard);
router.delete('/:id', authenticate, flashcardController.deleteFlashcard);
router.put('/:id/favorite', authenticate, flashcardController.toggleFavorite);
router.post('/:id/review', authenticate, flashcardController.reviewFlashcard);

module.exports = router;
