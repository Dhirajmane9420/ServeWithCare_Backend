// backend/routes/requests.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Request = require('../models/Request'); 
// --- 1. IMPORT THE EMAIL UTILITY ---
const sendConfirmationEmail = require('../utils/email');

// --- POST: Receiver Requests a Donation ---
// @route   POST /api/requests/:donationId
// @desc    Receiver sends a request for a specific donation
router.post('/:donationId', auth, async (req, res) => {
    try {
        const { message } = req.body || {}; 
        
        const receiverUser = await User.findById(req.user.id);
        // --- 2. Populate user field in donation to get donor's email ---
        const donation = await Donation.findById(req.params.donationId).populate('user'); 

        if (!receiverUser || receiverUser.role !== 'receiver') {
            return res.status(401).json({ msg: 'Only receivers can request donations.' });
        }
        if (!donation) {
            return res.status(404).json({ msg: 'Donation not found.' });
        }
        if (donation.status !== 'Available') {
            return res.status(400).json({ msg: 'Donation is no longer available.' });
        }

        const existingRequest = await Request.findOne({
            donation: req.params.donationId,
            receiver: req.user.id,
            status: { $in: ['Pending', 'Accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({ msg: 'You already have a pending or accepted request for this donation.' });
        }

        const newRequest = new Request({
            donation: req.params.donationId,
            receiver: req.user.id,
            donor: donation.user._id, // Use the populated donor's ID
            status: 'Pending',
            receiverName: receiverUser.name, 
            message: message || '',
        });

        await newRequest.save();

        donation.status = 'Requested'; 
        await donation.save();

        // --- 3. SEND EMAIL TO DONOR ---
        // donation.user is already populated with the donor's User object
        const donor = donation.user; 
        if (donor && donor.email) {
            const donorRequestSubject = `New Request for Your "${donation.foodType}" Donation!`;
            const donorRequestHtml = `
                <p>Dear ${donor.name},</p>
                <p>A receiver, <strong>${receiverUser.name}</strong>, has requested your donation of <strong>${donation.foodType} (${donation.quantity})</strong>.</p>
                <p>Please log in to your dashboard to review this request.</p>
                <p><a href="${process.env.FRONTEND_URL}/dashboard/donor/donations" style="background-color: #F4A261; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Donation Requests</a></p>
                <p>Thank you,</p>
                <p>The ServeWithCare Team</p>
            `;
            sendConfirmationEmail({
                toEmail: donor.email,
                subject: donorRequestSubject,
                htmlContent: donorRequestHtml
            });
        } else {
            console.warn(`[Email Warn] Donor email not found for donation ${donation._id}. Request email not sent.`);
        }
        // -----------------------------

        res.status(201).json({ msg: 'Donation requested successfully!', request: newRequest });

    } catch (error) {
        console.error('Error creating donation request:', error.message);
        res.status(500).send('Server Error');
    }
});


// --- PUT: Donor Accepts a Donation Request ---
// @route   PUT /api/requests/:requestId/accept
// @desc    Donor accepts a specific donation request
router.put('/:requestId/accept', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorUser = await User.findById(req.user.id);

    if (!donorUser || donorUser.role !== 'donor') {
      return res.status(401).json({ msg: 'Only donors are authorized to accept requests.' });
    }

    // --- 4. Populate receiver's email and donation details ---
    const request = await Request.findById(requestId) 
      .populate('donation')
      .populate('receiver', 'name email'); // <-- Get receiver's name and email

    if (!request) {
      return res.status(404).json({ msg: 'Donation request not found.' });
    }
    if (!request.donation) {
        return res.status(404).json({ msg: 'Associated donation not found for this request.' });
    }
    if (request.donation.user.toString() !== req.user.id) { 
      return res.status(403).json({ msg: 'Not authorized to accept this request.' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ msg: 'Request is not in pending status.' });
    }

    request.status = 'Accepted';
    await request.save();

    request.donation.status = 'Completed'; 
    await request.donation.save();

    // --- 5. SEND EMAIL TO RECEIVER ---
    if (request.receiver && request.receiver.email) { 
        const receiverSubject = `Your Donation Request for "${request.donation.foodType}" Has Been Accepted!`;
        const receiverHtml = `
          <p>Dear ${request.receiver.name},</p>
          <p>Great news! Your request for <strong>${request.donation.foodType} (${request.donation.quantity})</strong> from <strong>${donorUser.name}</strong> has been <strong>ACCEPTED</strong>.</p>
          <p>You can now use the chat feature to coordinate pickup details with the donor:</p>
          <p><a href="${process.env.FRONTEND_URL}/chat/${request._id}" style="background-color: #2A9D8F; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Chat</a></p>
          <p>Thank you for helping us make a difference!</p>
          <p>Sincerely,</p>
          <p>The ServeWithCare Team</p>
        `;
        sendConfirmationEmail({
          toEmail: request.receiver.email,
          subject: receiverSubject,
          htmlContent: receiverHtml
        });
    } else {
        console.warn(`[Email Warn] Receiver email not found for request ${requestId}. Acceptance email not sent.`);
    }
    // ---------------------------------

    res.json({ msg: 'Donation request accepted successfully!', request });

  } catch (error) {
    console.error('Error accepting donation request:', error.message);
    res.status(500).send('Server Error');
  }
});


// --- GET: Receiver's Own Requests ---
// @route   GET /api/requests/me 
// @desc    Get all requests made by the authenticated receiver
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'receiver') {
            return res.status(401).json({ msg: 'Not authorized to view requests.' });
        }
        const requests = await Request.find({ receiver: req.user.id })
            .populate('donation')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching receiver requests:', error.message);
        res.status(500).send('Server Error');
    }
});


// --- GET: Incoming Requests for a Donor ---
// @route   GET /api/requests/incoming
// @desc    Get all requests made for donations by the authenticated donor
router.get('/incoming', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'donor') {
            return res.status(401).json({ msg: 'Not authorized to view incoming requests.' });
        }
        
        const requests = await Request.find({ donor: req.user.id })
            .populate('donation')
            .populate('receiver', 'name') // Get the receiver's name
            .sort({ createdAt: -1 });
        
        res.json(requests);

    } catch (error) {
        console.error('Error fetching incoming requests for donor:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;