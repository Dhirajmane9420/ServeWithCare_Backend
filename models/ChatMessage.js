const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['donor', 'receiver'],
    required: true,
  },
  senderName: { // <-- NEW: Store the name for display
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);