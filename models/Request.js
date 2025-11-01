// backend/models/Request.js

const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    donation: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Donation', 
        required: true 
    },
    receiver: { // The User ID of the receiver
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    donor: { // The User ID of the donor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The Request status can be Pending
    status: { 
        type: String, 
        enum: ['Pending', 'Accepted', 'Rejected', 'Fulfilled'], 
        default: 'Pending' 
    },
    // Note: Your model from earlier didn't have receiverName or message.
    // I'm adding them back as optional.
    receiverName: { 
        type: String 
    },
    message: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

module.exports = mongoose.model('Request', RequestSchema);