const fs = require('fs');
const path = require('path');

let pdfParse, PDFDocument, createWorker, sharp;
try { pdfParse = require('pdf-parse'); } catch (e) { pdfParse = null; }
try { PDFDocument = require('pdfkit'); } catch (e) { PDFDocument = null; }
try { ({ createWorker } = require('tesseract.js')); } catch (e) { createWorker = null; }
try { sharp = require('sharp'); } catch (e) { sharp = null; }

const extractText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

const extractTextWithOCR = async (filePath) => {
  try {
    const text = await extractText(filePath);
    if (text.trim().length > 50) return { text, ocrUsed: false };

    const worker = await createWorker('eng');
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return { text: data.text, ocrUsed: true };
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

const generatePDFReviewer = async (content, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    doc.fontSize(24).font('Helvetica-Bold').text('STEMPal - Study Reviewer', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    if (typeof content === 'object') {
      Object.entries(content).forEach(([key, value]) => {
        doc.fontSize(18).font('Helvetica-Bold').text(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        doc.moveDown(0.5);

        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object') {
              Object.entries(item).forEach(([k, v]) => {
                doc.fontSize(11).font('Helvetica-Bold').text(`${k}: `, { continued: true });
                doc.font('Helvetica').text(String(v));
              });
            } else {
              doc.fontSize(11).font('Helvetica').text(`• ${item}`);
            }
            doc.moveDown(0.3);
          });
        } else {
          doc.fontSize(11).font('Helvetica').text(String(value));
        }
        doc.moveDown();
      });
    } else {
      doc.fontSize(11).font('Helvetica').text(String(content));
    }

    doc.footer = (doc) => {
      doc.fontSize(8).text('Powered by STEMPal', 50, doc.page.height - 50, { align: 'center' });
    };

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

const generateQuizPDF = async (questions, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);
    doc.fontSize(24).font('Helvetica-Bold').text('STEMPal - Practice Quiz', { align: 'center' });
    doc.moveDown(2);

    questions.forEach((q, i) => {
      doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${q.question}`);
      doc.moveDown(0.3);

      if (q.options) {
        q.options.forEach((opt, j) => {
          doc.fontSize(10).font('Helvetica').text(`  ${String.fromCharCode(65 + j)}. ${opt}`);
        });
      }

      if (q.answer) {
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666').text(`Answer: ${q.answer}`);
        doc.fillColor('#000');
      }

      doc.moveDown();
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

const generateFlashcardPDF = async (flashcards, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);
    doc.fontSize(24).font('Helvetica-Bold').text('STEMPal - Flashcards', { align: 'center' });
    doc.moveDown(2);

    flashcards.forEach((fc, i) => {
      doc.fontSize(12).font('Helvetica-Bold').text(`Card ${i + 1}: ${fc.question}`);
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#2563eb').text(`Answer: ${fc.answer}`);
      doc.fillColor('#000');
      doc.moveDown();
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

module.exports = {
  extractText,
  extractTextWithOCR,
  generatePDFReviewer,
  generateQuizPDF,
  generateFlashcardPDF
};
