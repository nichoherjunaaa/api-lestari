import Product from '../models/Product.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Seller
 */
// controllers/productController.js
export const createProduct = catchAsync(async (req, res, next) => {
    // Ambil data dari body request
    const body = req.body;
    const slug = body.name.toLowerCase().replace(/ /g, '-');

    // Auto-fill seller info dari user yang login
    const productData = {
        ...body,
        slug,
        sellerId: req.user._id,
        sellerName: req.user.name,
        sellerLocation: req.user.address?.city || 'Tidak diketahui'
    };

    const product = await Product.create(productData);

    res.status(201).json({ product });
});

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = catchAsync(async (req, res, next) => {
    // Execute query
    const features = new APIFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const products = await features.query;

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products
        }
    });
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate({
        path: 'seller',
        select: 'name profilePicture rating'
    });

    if (!product) {
        return next(new AppError('Produk tidak ditemukan', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    });
});

/**
 * @desc    Update product
 * @route   PATCH /api/products/:id
 * @access  Private/Seller/Admin
 */
export const updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new AppError('Produk tidak ditemukan', 404));
    }

    // Check if user is product owner or admin
    if (product.seller !== req.user.id && req.user.role !== 'seller') {
        return next(new AppError('Anda tidak memiliki izin untuk mengupdate produk ini', 403));
    }

    // Recalculate discount if price/discount changed
    if (req.body.price || req.body.discountPrice) {
        const currentPrice = req.body.price || product.price;
        const currentDiscount = req.body.discountPrice || product.discountPrice;

        if (currentPrice && currentDiscount) {
            req.body.discountPercentage = Math.round(
                ((currentPrice - currentDiscount) / currentPrice * 100)
            );
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            product: updatedProduct
        }
    });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Seller/Admin
 */
export const deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new AppError('Produk tidak ditemukan', 404));
    }

    // Check if user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Anda tidak memiliki izin untuk menghapus produk ini', 403));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * @desc    Get products by seller
 * @route   GET /api/products/seller/:sellerId
 * @access  Public
 */
export const getProductsBySeller = catchAsync(async (req, res, next) => {
    const products = await Product.find({ seller: req.params.sellerId });

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products
        }
    });
});

/**
 * @desc    Create product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createProductReview = catchAsync(async (req, res, next) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new AppError('Produk tidak ditemukan', 404));
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
        review => review.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
        return next(new AppError('Anda sudah memberikan review untuk produk ini', 400));
    }

    // Create review
    const review = {
        user: req.user.id,
        name: req.user.name,
        rating: Number(rating),
        comment
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({
        status: 'success',
        message: 'Review berhasil ditambahkan'
    });
});

/**
 * @desc    Get top rated products
 * @route   GET /api/products/top-rated
 * @access  Public
 */
export const getTopProducts = catchAsync(async (req, res, next) => {
    const products = await Product.find()
        .sort({ rating: -1 })
        .limit(5);

    res.status(200).json({
        status: 'success',
        data: {
            products
        }
    });
});