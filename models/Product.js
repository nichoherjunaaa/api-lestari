import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const productSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Nama produk harus diisi'],
        trim: true,
        maxlength: [100, 'Nama produk tidak boleh lebih dari 100 karakter']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Deskripsi produk harus diisi']
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerName: {
        type: String,
        required: true
    },
    sellerLocation: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: [true, 'Kategori produk harus diisi'],
        enum: [
            'makanan', 'minuman', 'kerajinan', 'fashion',
            'kecantikan', 'rumah-tangga', 'elektronik', 'lainnya'
        ]
    },
    subCategory: {
        type: String
    },
    price: {
        type: Number,
        required: [true, 'Harga produk harus diisi'],
        min: [0, 'Harga tidak boleh negatif']
    },
    discountPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                return value < this.price;
            },
            message: 'Harga diskon harus lebih kecil dari harga normal'
        }
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stok tidak boleh negatif']
    },
    weight: {
        type: Number,
        required: true,
        min: [0, 'Berat tidak boleh negatif']
    },
    unit: {
        type: String,
        default: 'gram'
    },

    // Media
    images: {
        type: [String],
        required: [true, 'Produk harus memiliki minimal 1 gambar'],
        validate: {
            validator: function (array) {
                return array.length > 0;
            },
            message: 'Produk harus memiliki minimal 1 gambar'
        }
    },

    // Product Specifications
    materials: {
        type: [String]
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    colors: {
        type: [String]
    },
    variants: [
        {
            name: String,
            options: [String],
            prices: [Number]
        }
    ],

    // Additional Info
    isFeatured: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    tags: {
        type: [String]
    },

    // Ratings & Reviews
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    reviews: [reviewSchema],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps on save
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Text index for search
productSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
});

export default mongoose.model('Product', productSchema);