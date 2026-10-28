const { getFirebase } = require('./firebase');
const { getConfig } = require('./config');

async function requireAuth(req, res, next) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  if (getConfig().demo && header.slice(7) === 'demo-token') {
    req.user = { uid: 'demo-user', email: 'demo@colegioabogados.es' };
    return next();
  }

  try {
    req.user = await getFirebase().auth.verifyIdToken(header.slice(7));
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired Firebase authorization token' });
  }
}

module.exports = { requireAuth };
