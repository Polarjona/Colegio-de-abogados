const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConfig } = require('./config');

const config = getConfig();

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

function requireAuth(req, res, next) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authorization token' });
  }
}

module.exports = { comparePassword, createToken, hashPassword, requireAuth };
