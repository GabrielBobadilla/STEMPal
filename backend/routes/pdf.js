const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/upload');

router.post('/upload', authenticate, uploadPDF(), pdfController.uploadPDF);
router.post('/:id/process', authenticate, pdfController.processPDF);
router.get('/', authenticate, pdfController.getPDFs);
router.get('/:id', authenticate, pdfController.getPDF);
router.delete('/:id', authenticate, pdfController.deletePDF);

module.exports = router;
