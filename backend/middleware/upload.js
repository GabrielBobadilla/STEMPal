const Busboy = require('busboy');
const { storage, db } = require('../config/firebase');

const BUCKETS = {
  pdfs: 'stemPal-pdfs',
  scanned: 'stemPal-scanned',
  profiles: 'stemPal-profiles',
};

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } });
    const fields = {};
    const files = [];

    busboy.on('field', (name, value) => { fields[name] = value; });
    busboy.on('file', (name, stream, info) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        files.push({
          fieldname: name,
          originalname: info.filename,
          mimetype: info.mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });
    busboy.on('finish', () => resolve({ fields, files }));
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

async function uploadToStorage(file, bucketName, destination) {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(destination);
  await blob.save(file.buffer, { metadata: { contentType: file.mimetype } });
  await blob.makePublic();
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(destination)}`;
}

async function deleteFromStorage(url) {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/([^/]+)\/(.+)$/);
    if (!match) return;
    const bucket = storage.bucket(match[1]);
    await bucket.file(match[2]).delete();
  } catch (error) {
    console.warn('Failed to delete from storage:', error.message);
  }
}

function uploadPDF() {
  return async (req, res, next) => {
    try {
      const { fields, files } = await parseMultipart(req);
      Object.assign(req.body, fields);
      if (files.length > 0) {
        req.file = files[0];
      }
      next();
    } catch (error) {
      res.status(400).json({ message: 'Failed to parse upload', error: error.message });
    }
  };
}

function uploadProfilePicture() {
  return async (req, res, next) => {
    try {
      const { fields, files } = await parseMultipart(req);
      Object.assign(req.body, fields);
      if (files.length > 0) {
        req.file = files[0];
      }
      next();
    } catch (error) {
      res.status(400).json({ message: 'Failed to parse upload', error: error.message });
    }
  };
}

module.exports = { uploadPDF, uploadProfilePicture, uploadToStorage, deleteFromStorage, parseMultipart, BUCKETS };
