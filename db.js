const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // This line reads the MONGO_URI from your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;