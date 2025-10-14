const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Token requis' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
}

module.exports = { authMiddleware };




