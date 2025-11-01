const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // 1. Get token from the request header ('x-auth-token')
  const token = req.header('x-auth-token');

  // 2. Check if no token is present
  if (!token) {
    // 401 Unauthorized - The client didn't provide a token
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify token's signature using the secret key
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the decoded user payload ({ id, role }) to the request object
    // This allows subsequent route handlers (like donations.js) to access req.user.id
    req.user = decoded.user;
    
    // 5. Move to the next middleware/route handler
    next();
  } catch (err) {
    // 401 Unauthorized - The token is invalid, expired, or corrupted
    res.status(401).json({ msg: 'Token is not valid' });
  }
};