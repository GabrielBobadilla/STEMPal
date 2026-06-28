const pool = require('../config/db');
const pdfService = require('../utils/pdfService');
const aiService = require('../utils/aiService');
const path = require('path');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    const [result] = await pool.query(
      'INSERT INTO pdf_uploads (user_id, filename, original_name, file_size, file_path) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.file.filename, req.file.originalname, req.file.size, req.file.path]
    );

    res.status(201).json({ message: 'PDF uploaded.', id: result.insertId, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.' });
  }
};

const processPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const [pdfs] = await pool.query('SELECT * FROM pdf_uploads WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (pdfs.length === 0) return res.status(404).json({ message: 'PDF not found.' });

    const pdf = pdfs[0];
    const { text, ocrUsed } = await pdfService.extractTextWithOCR(pdf.file_path);

    await pool.query('UPDATE pdf_uploads SET extracted_text = ?, ocr_used = ? WHERE id = ?', [text, ocrUsed, id]);

    const organized = await aiService.extractTextFromPDF(text);

    res.json({ message: 'PDF processed.', extracted_text: text, organized, ocr_used: ocrUsed });
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ message: 'Failed to process PDF.' });
  }
};

const getPDFs = async (req, res) => {
  try {
    const [pdfs] = await pool.query(
      'SELECT id, filename, original_name, file_size, ocr_used, upload_date FROM pdf_uploads WHERE user_id = ? ORDER BY upload_date DESC',
      [req.user.id]
    );
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPDF = async (req, res) => {
  try {
    const [pdfs] = await pool.query('SELECT * FROM pdf_uploads WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (pdfs.length === 0) return res.status(404).json({ message: 'PDF not found.' });
    res.json(pdfs[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deletePDF = async (req, res) => {
  try {
    const [pdfs] = await pool.query('SELECT file_path FROM pdf_uploads WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (pdfs.length > 0 && pdfs[0].file_path) {
      const fs = require('fs');
      if (fs.existsSync(pdfs[0].file_path)) fs.unlinkSync(pdfs[0].file_path);
    }
    await pool.query('DELETE FROM pdf_uploads WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'PDF deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { uploadPDF, processPDF, getPDFs, getPDF, deletePDF };
