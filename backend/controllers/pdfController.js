const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const { deleteFile } = require('../middleware/upload');
const pdfService = require('../utils/pdfService');
const aiService = require('../utils/aiService');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    const filePath = `/uploads/pdfs/${req.file.filename}`;

    const ref = await db.collection('pdf_uploads').add({
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_size: req.file.size,
      file_path: filePath,
      extracted_text: null,
      ocr_used: false,
      created_at: FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'PDF uploaded.', id: ref.id, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.' });
  }
};

const processPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('pdf_uploads').doc(id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }

    const pdf = doc.data();
    const fullPath = require('path').resolve(__dirname, '..', pdf.file_path);
    const { text, ocrUsed } = await pdfService.extractTextWithOCR(fullPath);

    await doc.ref.update({ extracted_text: text, ocr_used: ocrUsed });

    const organized = await aiService.extractTextFromPDF(text);
    res.json({ message: 'PDF processed.', extracted_text: text, organized, ocr_used: ocrUsed });
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ message: 'Failed to process PDF.' });
  }
};

const getPDFs = async (req, res) => {
  try {
    const snap = await db.collection('pdf_uploads')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();
    const pdfs = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, filename: data.filename, original_name: data.original_name, file_size: data.file_size, ocr_used: data.ocr_used, upload_date: data.created_at };
    });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPDF = async (req, res) => {
  try {
    const doc = await db.collection('pdf_uploads').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deletePDF = async (req, res) => {
  try {
    const doc = await db.collection('pdf_uploads').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }
    if (doc.data().file_path) {
      deleteFile(doc.data().file_path);
    }
    await doc.ref.delete();
    res.json({ message: 'PDF deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { uploadPDF, processPDF, getPDFs, getPDF, deletePDF };
