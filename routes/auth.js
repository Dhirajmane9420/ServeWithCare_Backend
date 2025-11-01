// backend/src/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import our User model
const sendConfirmationEmail = require('../utils/email'); // <-- NEW: Import email utility

// --- SIGNUP ROUTE ---
// @route   POST /api/auth/signup
// @desc    Register a new user and send welcome email
router.post('/signup', async (req, res) => {
  try {
    // 1. Get user data from the request body
    const { name, email, password, role } = req.body;

    // 2. Check if user already exists in the database
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 3. Create a new user instance
    user = new User({
      name,
      email,
      password,
      role,
    });

    // 4. Save the user (the 'pre-save' hook in User.js will hash the password)
    await user.save();

    // 5. Send a welcome email to the new user
    const welcomeSubject = 'Welcome to ServeWithCare!';
    const welcomeHtml = `
      <p>Dear ${name},</p>
      <p>Welcome to ServeWithCare! We're thrilled to have you join our mission to reduce food waste and connect communities.</p>
      <p>Your account has been successfully created as a **${role.toUpperCase()}**.</p>
      <p>You can now log in and start making a difference:</p>
      <p><a href="${process.env.FRONTEND_URL}/login" style="background-color: #2A9D8F; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a></p>
      <p>Thank you for being a part of ServeWithCare.</p>
      <p>Sincerely,</p>
      <p>The ServeWithCare Team</p>
    `;
    // Using process.env.FRONTEND_URL - you'll need to define this in your .env
    sendConfirmationEmail({ 
      toEmail: email, 
      subject: welcomeSubject, 
      htmlContent: welcomeHtml 
    });


    // 6. Send a success response
    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- LOGIN ROUTE ---
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    // 1. Get credentials from request body
    const { email, password } = req.body;

    // 2. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 4. If they match, create a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id, // This is the user's ID from the database
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your secret key from .env
      { expiresIn: '3h' }, // Token expires in 3 hours
      (err, token) => {
        if (err) throw err;
        
        // 5. Send the token and user info back to the frontend
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            // Send profile data too
            contact: user.contact,
            address: user.address,
            ngo: user.ngo,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;