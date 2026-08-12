const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'cropsmart_secret_2024';

// Register
router.post('/register', async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    const { name, email, phone, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    if (!name || !password) {
      return res.status(400).json({
        error: "Name and password are required"
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        error: "Provide either email or phone number"
      });
    }

    if (email) {
      const existingEmail = normalizedEmail
        ? await User.findOne({ email: normalizedEmail })
        : null;
      if (existingEmail) {
        return res.status(409).json({
          error: "Email already registered"
        });
      }
    }

    if (normalizedPhone) {
      const existingPhone = await User.findOne({
        phone: normalizedPhone
      });

      if (existingPhone) {
        return res.status(409).json({
          error: "Phone number already registered"
        });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({

      name: name.trim(),
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      password: hash
    });

    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {

    const { identifier, password } = req.body;

    console.log("REQUEST BODY:", req.body);

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Identifier and password are required"
      });
    }

    const value = identifier.trim();

    console.log("Searching with:", {
      email: value.toLowerCase(),
      phone: value
    });

    const user = await User.findOne({
      $or: [
        { email: value.toLowerCase() },
        { phone: value }
      ]
    });

    console.log("Found User:", user);


    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    console.log("Password Match:", isMatch);


    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
