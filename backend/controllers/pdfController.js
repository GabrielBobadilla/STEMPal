const supabase = require('../config/supabase');
const { deleteFile } = require('../middleware/upload');
const pdfService = require('../utils/pdfService');
const aiService = require('../utils/aiService');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    const filePath = `/uploads/pdfs/${req.file.filename}`;

    const { data: row } = await supabase.from('pdf_uploads').insert({
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_size: req.file.size,
      file_path: filePath,
      extracted_text: null,
      ocr_used: false,
      created_at: new Date().toISOString()
    }).select().single();

    res.status(201).json({ message: 'PDF uploaded.', id: row?.id, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.' });
  }
};

const processPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pdf } = await supabase.from('pdf_uploads').select('*').eq('id', id).single();
    if (!pdf || pdf.user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }

    const fullPath = require('path').resolve(__dirname, '..', pdf.file_path);
    const { text, ocrUsed } = await pdfService.extractTextWithOCR(fullPath);

    await supabase.from('pdf_uploads').update({ extracted_text: text, ocr_used: ocrUsed }).eq('id', id);

    const organized = await aiService.extractTextFromPDF(text);
    res.json({ message: 'PDF processed.', extracted_text: text, organized, ocr_used: ocrUsed });
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ message: 'Failed to process PDF.' });
  }
};

const getPDFs = async (req, res) => {
  try {
    const { data: rows } = await supabase.from('pdf_uploads')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    const pdfs = (rows || []).map(data => ({
      id: data.id, filename: data.filename, original_name: data.original_name,
      file_size: data.file_size, ocr_used: data.ocr_used, upload_date: data.created_at
    }));
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPDF = async (req, res) => {
  try {
    const { data: row } = await supabase.from('pdf_uploads').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deletePDF = async (req, res) => {
  try {
    const { data: row } = await supabase.from('pdf_uploads').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'PDF not found.' });
    }
    if (row.file_path) {
      deleteFile(row.file_path);
    }
    await supabase.from('pdf_uploads').delete().eq('id', req.params.id);
    res.json({ message: 'PDF deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { uploadPDF, processPDF, getPDFs, getPDF, deletePDF };
