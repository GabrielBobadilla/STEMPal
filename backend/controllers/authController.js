const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const demoUsers = [
  {
    id: 1,
    fullname: 'STEMPal Admin',
    email: 'admin@stempal.com',
    password: '$2a$10$Pvxxj0px7Vif0MAsc.tp2eQqqRLlFEcUqiSrYzr6hH2h6MA0AZHN6',
    role: 'admin',
    profile_picture: null,
    theme_preference: null
  },
  {
    id: 2,
    fullname: 'Juan Dela Cruz',
    email: 'juan@gmail.com',
    password: '$2a$10$c3FY0U8X1WqjkhKrLBIOXu8bgawgqwHXjUO4yN6laec.lEhhF7a9C',
    role: 'student',
    profile_picture: null,
    theme_preference: null
  }
];

const register = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (fullname, email, phone, password) VALUES (?, ?, ?, ?)',
      [fullname, email, phone || null, hashedPassword]
    );

    await pool.query('INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)', [result.insertId]);

    const token = jwt.sign({ id: result.insertId, role: 'student' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, fullname, email, role: 'student' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    let user;

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) {
        const dbUser = users[0];
        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (isMatch) user = dbUser;
      }
    } catch {
      console.log('DB unavailable, falling back to demo users');
    }

    if (!user) {
      const demoUser = demoUsers.find(u => u.email === email);
      if (!demoUser) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const isMatch = await bcrypt.compare(password, demoUser.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      user = demoUser;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture || null,
        theme_preference: user.theme_preference || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const resetToken = jwt.sign({ id: users[0].id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Password reset link sent.', resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
