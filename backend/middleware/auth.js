const { auth, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = { id: uid, ...userDoc.data() };
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ message: 'Token revoked.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      req.user = { id: uid, ...userDoc.data() };
    }
  } catch (error) {
    // Token invalid but optional, continue without user
  }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
