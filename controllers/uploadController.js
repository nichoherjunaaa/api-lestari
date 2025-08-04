import cloudinary from '../utils/cloudinary.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Upload single image
 */
export const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Silakan upload gambar', 400));
  }

  // Upload buffer ke Cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'lestari-lokal' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(req.file.buffer);
  });

  res.status(200).json({
    status: 'success',
    data: {
      url: result.secure_url,
      publicId: result.public_id
    }
  });
});

/**
 * Upload multiple images
 */
export const uploadImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Silakan upload minimal 1 gambar', 400));
  }

  // Upload semua gambar paralel
  const uploadPromises = req.files.map(file => (
    new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'lestari-lokal' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    })
  ));

  const results = await Promise.all(uploadPromises);

  res.status(200).json({
    status: 'success',
    data: results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }))
  });
});

/**
 * Delete image
 */
export const deleteImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.body;
  
  if (!publicId) {
    return next(new AppError('Public ID gambar diperlukan', 400));
  }

  await cloudinary.uploader.destroy(publicId);

  res.status(204).json({
    status: 'success',
    data: null
  });
});