const jwt = require('jsonwebtoken');

// JWT authentication middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  // No token provided
  if (!authHeader) {
    return res.status(401).json({ error: 'Token missing' });
  }
  

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify token and attach decoded data to request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // allow request to continue
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = auth;
