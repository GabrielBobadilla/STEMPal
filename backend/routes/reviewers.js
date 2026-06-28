const express = require('express');
const router = express.Router();
const reviewerController = require('../controllers/reviewerController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, reviewerController.generateReviewer);
router.get('/', authenticate, reviewerController.getReviewers);
router.get('/:id', authenticate, reviewerController.getReviewer);
router.delete('/:id', authenticate, reviewerController.deleteReviewer);
router.post('/formulas', authenticate, reviewerController.generateFormulaSheet);
router.post('/key-terms', authenticate, reviewerController.generateKeyTerms);

module.exports = router;
