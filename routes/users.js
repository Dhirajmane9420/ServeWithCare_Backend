const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import our auth middleware
const User = require('../models/User'); // Import the User model

// --- GET CURRENT USER'S PROFILE ---
// @route   GET /api/users/me
// @desc    Get current user's profile (based on token)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id was added by the auth middleware
    const user = await User.findById(req.user.id).select('-password'); // Find user, remove password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- UPDATE USER'S PROFILE ---
// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  // Get data from the request body
  const { name, contact, address, ngo } = req.body;

  // Build the profile object dynamically
  const profileFields = {};
  if (name) profileFields.name = name;
  if (contact) profileFields.contact = contact;
  if (address) profileFields.address = address;
  if (ngo) profileFields.ngo = ngo;

  try {
    // 1. Find user by ID (from token) and update their data
    // We explicitly exclude the email field from the update, as it shouldn't change here.
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true } // Returns the new, updated document
    ).select('-password');

    // 2. Return the updated user data
    res.json(user);

  } catch (err) {
    console.error('Profile update failed:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;