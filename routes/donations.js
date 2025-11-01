// backend/src/routes/donations.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donation = require('../models/Donation');
const User = require('../models/User');
const sendConfirmationEmail = require('../utils/email'); // <-- NEW: Import email utility

// --- POST A NEW DONATION ---
// @route   POST /api/donations
// @desc    Create a new food donation and send confirmation email to donor
router.post('/', auth, async (req, res) => {
  try {
    const { foodType, quantity, location, expiryTime, latitude, longitude } = req.body;
    
    // 1. Get the authenticated user's profile
    const user = await User.findById(req.user.id);
    
    // Security check
    if (!user || user.role !== 'donor') {
      return res.status(401).json({ msg: 'Only donors are authorized to post donations.' });
    }

    // 2. Data Validation Check
    if (!foodType || !quantity || !location || !expiryTime) {
          return res.status(400).json({ msg: 'Please provide all required fields (type, quantity, location, and expiry time).' });
    }
    if (new Date(expiryTime) <= new Date()) {
          return res.status(400).json({ msg: 'Expiry time must be a date in the future.' });
    }

    // 3. Create new donation object
    const newDonation = new Donation({
      foodType,
      quantity,
      location,
      expiryTime,
      
      latitude: latitude ? Number(latitude) : null, 
      longitude: longitude ? Number(longitude) : null,
      
      user: req.user.id,        
      donorName: user.name,     
    });

    const donation = await newDonation.save();
    
    // 4. Send confirmation email to the donor
    const donorSubject = `Your Food Donation for "${foodType}" is Live!`;
    const donorHtml = `
      <p>Dear ${user.name},</p>
      <p>Thank you for your generous donation through ServeWithCare!</p>
      <p>Your donation for **${foodType} (${quantity})** at **${location}** has been successfully posted and is now available for receivers.</p>
      <p>Expiry Time: ${new Date(expiryTime).toLocaleString()}</p>
      <p>You will be notified when a receiver expresses interest or accepts your donation.</p>
      <p>Thank you for helping us fight food waste and hunger.</p>
      <p>Sincerely,</p>
      <p>The ServeWithCare Team</p>
    `;
    sendConfirmationEmail({ 
      toEmail: user.email, 
      subject: donorSubject, 
      htmlContent: donorHtml 
    });


    res.status(201).json(donation);

  } catch (err) {
    console.error('Donation POST failed:', err.message);
    res.status(500).send('Server Error');
  }
});

// FIX IS HERE: The server resolves this route
router.get('/available', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'receiver') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Find donations that are:
    // 1. Status is 'Available'
    // 2. Not expired (expiryTime is greater than now)
    const donations = await Donation.find({
      status: 'Available',
      expiryTime: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    res.json(donations);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- GET MY DONATIONS (History) ---
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'donor') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const donations = await Donation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(donations);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;