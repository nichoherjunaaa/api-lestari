import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  // Informasi Dasar
  name: {
    type: String,
    required: [true, 'Nama lengkap harus diisi'],
    trim: true,
    maxlength: [100, 'Nama tidak boleh lebih dari 100 karakter']
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email tidak valid']
  },
  phone: {
    type: String,
    required: [true, 'Nomor telepon harus diisi'],
    validate: {
      validator: function(v) {
        return /^[\d\s\+-]{8,15}$/.test(v);
      },
      message: 'Nomor telepon tidak valid'
    }
  },
  password: {
    type: String,
    required: [true, 'Password harus diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false
  },
  profilePicture: {
    type: String,
    default: 'default.jpg'
  },

  // Role Management
  role: {
    type: String,
    enum: ['client', 'seller', 'admin'],
    default: 'client'
  },
  // Informasi Alamat (untuk semua role)
  addresses: [
    {
      label: {
        type: String,
        enum: ['rumah', 'kantor', 'usaha', 'kos', 'lainnya'],
        default: 'rumah'
      },
      recipientName: String,
      phone: String,
      details: {
        street: String,
        village: String,
        district: String,
        city: String,
        province: String,
        postalCode: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      isBusinessAddress: {
        type: Boolean,
        default: false
      }
    }
  ],

  // Informasi Khusus Seller
  sellerInfo: {
    businessName: {
      type: String,
      trim: true,
      maxlength: [150, 'Nama usaha tidak boleh lebih dari 150 karakter']
    },
    businessDescription: String,
    businessLogo: String,
    businessType: {
      type: String,
      enum: ['individu', 'cv', 'pt', 'koperasi', 'lainnya']
    },
    businessRegistrationNumber: String,
    businessSince: Date,
    categories: {
      type: [String],
      enum: [
        'makanan', 'minuman', 'kerajinan', 'fashion',
        'kecantikan', 'rumah-tangga', 'elektronik', 'jasa', 'lainnya'
      ]
    },
    socialMedia: {
      instagram: String,
      facebook: String,
      tiktok: String,
      youtube: String,
      marketplaceLinks: [String]
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDocuments: [
      {
        documentType: String,
        documentUrl: String,
        uploadedAt: Date
      }
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },

  // Informasi Khusus Client
  clientInfo: {
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    favoriteSellers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Status Akun
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware untuk hash password sebelum save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = Date.now();
  next();
});

// Method untuk membandingkan password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method untuk generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Virtual populate untuk produk seller
userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'sellerId'
});

// Virtual untuk mendapatkan alamat utama
userSchema.virtual('primaryAddress').get(function() {
  return this.addresses.find(addr => addr.isPrimary) || this.addresses[0];
});

// Virtual untuk mendapatkan alamat usaha (seller)
userSchema.virtual('businessAddress').get(function() {
  if (this.role === 'seller') {
    return this.addresses.find(addr => addr.isBusinessAddress) || 
           this.addresses.find(addr => addr.label === 'usaha');
  }
  return null;
});

// Query helper untuk seller
userSchema.query.sellers = function() {
  return this.where({ role: 'seller' });
};

// Query helper untuk clients
userSchema.query.clients = function() {
  return this.where({ role: 'client' });
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

 export default mongoose.model('User', userSchema);