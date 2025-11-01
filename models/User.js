const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true, // 'donor' or 'receiver'
    enum: ['donor', 'receiver'],
  },
  // We add the profile fields here
  contact: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  ngo: { // For receivers
    type: String,
    default: '',
  }
});

// This is a "pre-save hook"
// It automatically hashes the password before saving a new user
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);