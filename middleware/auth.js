import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // 1. Dapatkan token dari header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Anda tidak memiliki akses. Silakan login terlebih dahulu.', 401)
      );
    }

    // 2. Verifikasi token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // 3. Cek user masih ada
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('User yang terkait dengan token ini tidak ditemukan.', 401)
      );
    }

    // 4. Cek jika user ganti password setelah token dibuat
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User baru saja mengganti password! Silakan login lagi.', 401)
      );
    }

    // 5. Grant access ke route yang diproteksi
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware untuk membatasi akses berdasarkan role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Anda tidak memiliki izin untuk melakukan aksi ini.', 403)
      );
    }
    next();
  };
};

// Middleware untuk memeriksa kepemilikan resource
export const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params.id);

      if (!doc) {
        return next(new AppError('Dokumen tidak ditemukan', 404));
      }

      // Admin bisa mengakses semua resource
      if (req.user.role === 'admin') return next();

      // Cek kepemilikan
      if (doc.sellerId.toString() !== req.user.id.toString()) {
        return next(
          new AppError('Anda tidak memiliki izin untuk mengakses resource ini', 403)
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};