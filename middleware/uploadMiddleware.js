import multer from 'multer';
import AppError from '../utils/appError.js';

// Simpan file sementara di memory (buffer)
const storage = multer.memoryStorage();

// Filter hanya menerima gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Hanya file gambar yang diperbolehkan!', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware untuk single upload
export const uploadSingleImage = upload.single('image');

// Middleware untuk multiple upload (max 4)
export const uploadMultipleImages = upload.array('images', 4);