const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, noteController.getNotes);
router.get('/saved', authenticate, noteController.getSavedNotes);
router.get('/:id', authenticate, noteController.getNote);
router.post('/', authenticate, noteController.createNote);
router.put('/:id', authenticate, noteController.updateNote);
router.delete('/:id', authenticate, noteController.deleteNote);
router.put('/:id/save', authenticate, noteController.saveNote);

module.exports = router;
