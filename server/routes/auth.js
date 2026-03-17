const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SIGNUP Route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log('📝 Signup attempt:', { email, name });

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate initials from name
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      initials
    });

    await newUser.save();
    console.log('✅ User created successfully:', email);

    // Generate token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
    res.status(500).json({ msg: "Server error during signup", error: error.message });
  }
});

// LOGIN Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      msg: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, initials: user.initials }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error during login", error: error.message });
  }
});

module.exports = router;