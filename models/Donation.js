// backend/models/Donation.js

const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  user: { // The Donor
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donorName: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  photo: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    // A Donation is Available, then Requested, then Accepted, then Completed.
    enum: ['Available', 'Requested', 'Accepted', 'Completed'], 
    default: 'Available', 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Donation', DonationSchema);