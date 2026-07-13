const multer = require('multer');
const supabase = require('../config/supabase');

const storage = multer.memoryStorage();

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

async function uploadToSupabase(bucket, filePath, fileBuffer, contentType) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, { contentType, upsert: true });
  if (error) throw error;
  return data;
}

function getPublicUrl(bucket, filePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

async function deleteFromSupabase(bucket, filePath) {
  if (!filePath) return;
  try {
    await supabase.storage.from(bucket).remove([filePath]);
  } catch (e) {
    console.warn('Failed to delete from storage:', e.message);
  }
}

async function deleteFile(filePath) {
  if (!filePath) return;
  if (filePath.startsWith('http')) {
    const match = filePath.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (match) await deleteFromSupabase(match[1], match[2]);
    return;
  }
}

module.exports = { uploadProfilePicture, uploadPDF, uploadToSupabase, getPublicUrl, deleteFile, deleteFromSupabase };
