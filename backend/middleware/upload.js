const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

['profiles', 'pdfs', 'scanned'].forEach(dir => {
  const dirPath = path.join(UPLOAD_DIR, dir);
  try { if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true }); } catch (e) {}
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'pdfs';
    if (req.path.includes('profile')) sub = 'profiles';
    else if (req.path.includes('scan')) sub = 'scanned';
    cb(null, path.join(UPLOAD_DIR, sub));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profile_picture') {
    cb(null, /jpeg|jpg|png|gif|webp/i.test(file.mimetype));
  } else if (file.fieldname === 'pdf') {
    cb(null, file.mimetype === 'application/pdf');
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

function uploadProfilePicture() {
  return upload.single('profile_picture');
}

function uploadPDF() {
  return upload.single('pdf');
}

function deleteFile(filePath) {
  try {
    if (!filePath) return;
    const full = filePath.startsWith('http') ? null : path.resolve(UPLOAD_DIR, '..', filePath);
    if (full && fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    console.warn('Failed to delete file:', e.message);
  }
}

module.exports = { uploadProfilePicture, uploadPDF, deleteFile };
