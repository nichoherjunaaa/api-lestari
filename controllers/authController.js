import User from '../models/User.js'
import jwt from "jsonwebtoken"
import { promisify } from "util"

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validasi role
    if (role && !['client', 'seller'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    // Cek jika email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Data dasar user
    const userData = {
      name,
      email,
      phone,
      password,
      role: role || 'client'
    };

    // Jika seller, tambahkan info dasar
    if (role === 'seller') {
      userData.sellerInfo = {
        businessName: `${name}'s Business`,
        businessType: 'individu',
        businessSince: new Date(),
        categories: ['lainnya']
      };
    }

    const newUser = await User.create(userData);

    // Generate token
    const token = newUser.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profilePicture: newUser.profilePicture
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Upgrade ke Seller
export const upgradeToSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, businessType, businessAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.role === 'seller') {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah terdaftar sebagai seller'
      });
    }

    // Update role dan tambahkan info seller
    user.role = 'seller';
    user.sellerInfo = {
      businessName,
      businessType,
      businessSince: new Date(),
      categories: ['lainnya']
    };

    // Tambahkan alamat usaha jika ada
    if (businessAddress) {
      user.addresses.push({
        ...businessAddress,
        label: 'usaha',
        isBusinessAddress: true
      });
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          businessName: user.sellerInfo.businessName
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Current User
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    // 2. Cek user exist + password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // 3. Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 4. Generate token
    const token = user.generateAuthToken();

    // 5. Kirim response dengan cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    res.cookie('jwt', token, cookieOptions);

    // 6. Sembunyikan password dari output
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  try {
    // 1. Set cookie expired
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 1000), // 1 detik
      httpOnly: true
    });

    // 2. Kirim response
    res.status(200).json({
      success: true,
      message: 'Berhasil logout'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};