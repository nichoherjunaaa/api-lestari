import express from 'express';
import {
  protect,
  authorize,
  checkOwnership
} from '../middleware/auth.js';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsBySeller,
  getTopProducts
} from '../controllers/productController.js';
import Product from '../models/Product.js';

const router = express.Router();

// Route yang diproteksi untuk semua user yang login
router.use(protect);

// Route khusus seller
router.post('/',
  authorize('seller'),
  createProduct
);

// Route untuk pemilik produk atau admin
router.route('/:id')
  .patch(
    checkOwnership(Product),
    updateProduct
  )
  .delete(
    authorize('seller', 'admin'),
    checkOwnership(Product),
    deleteProduct
  );

router.get('/', getAllProducts);
router.get('/seller/:sellerId', getProductsBySeller);
router.get('/product-top', getTopProducts);

export default router;