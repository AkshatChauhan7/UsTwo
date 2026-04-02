const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /api/auth/signup
 * Register a new user
 * Body: { email, password, name }
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    console.log('📝 Signup attempt:', { email, name });

    // Validation
    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({
        msg: "Email, password, and name are required",
        code: 'MISSING_FIELDS'
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters",
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      console.log('❌ User already exists:', normalizedEmail);
      return res.status(400).json({
        msg: "Email already registered",
        code: 'USER_EXISTS'
      });
    }

    // Generate initials from name
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // Create new user (password hashing handled by User pre-save hook)
    const newUser = new User({
      email: normalizedEmail,
      password,
      name,
      initials
    });

    await newUser.save();
    console.log('✅ User created successfully:', normalizedEmail);

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        initials: newUser.initials
      }
    });
  } catch (error) {
    console.error('🔥 Signup error:', error.message);
    res.status(500).json({
      msg: "Server error during signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    console.log('🔐 Login attempt:', normalizedEmail);

    // Validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
        code: 'MISSING_FIELDS'
      });
    }

    // Find user and explicitly include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log('❌ User not found:', normalizedEmail);
      return res.status(401).json({
        msg: "Invalid email or password",
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Compare password using User model method
    let isPasswordValid = await user.matchPassword(password);

    // Legacy fallback: support old plain-text passwords and migrate to bcrypt hash
    if (!isPasswordValid && user.password === password) {
      isPasswordValid = true;
      user.password = password;
      user.markModified('password');
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', normalizedEmail);
      return res.status(401).json({
        msg: "Invalid email or password",
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    console.log('✅ Login successful:', normalizedEmail);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        coupleId: user.coupleId
      }
    });
  } catch (error) {
    console.error('🔥 Login error:', error.message);
    res.status(500).json({
      msg: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/me
 * Verify JWT token and return current user
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('coupleId');

    if (!user) {
      return res.status(404).json({
        msg: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      msg: "User verified",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        coupleId: user.coupleId,
        profileColor: user.profileColor,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('🔥 Verify error:', error.message);
    res.status(500).json({
      msg: "Server error verifying user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;