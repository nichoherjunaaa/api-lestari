import express from 'express';

import {
  uploadSingleImage,
  uploadMultipleImages
} from '../middleware/uploadMiddleware.js';
import { deleteImage, uploadImage, uploadImages } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/image', uploadSingleImage, uploadImage);

router.post('/images', uploadMultipleImages, uploadImages);

router.delete('/', deleteImage);

export default router;