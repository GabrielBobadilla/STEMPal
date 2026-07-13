const supabase = require('../config/supabase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users').select('*').eq('id', user.id).single();

    if (profileError || !profile) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = { id: user.id, ...profile };
    next();
  } catch (error) {
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
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return next();

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', user.id).single();

    if (profile) req.user = { id: user.id, ...profile };
  } catch (error) {
    // Token invalid but optional, continue without user
  }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
