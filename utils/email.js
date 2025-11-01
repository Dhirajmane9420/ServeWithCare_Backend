// backend/utils/email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendConfirmationEmail = async ({ toEmail, subject, htmlContent }) => {
  try {
    const mailOptions = {
      from: `"ServeWithCare" <${process.env.EMAIL_USER}>`, 
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${toEmail}:`, error);
    return false;
  }
};

module.exports = sendConfirmationEmail;