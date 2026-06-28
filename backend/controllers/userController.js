const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, fullname, email, phone, profile_picture, grade_level, school, stem_strand, theme_preference, notification_enabled, total_xp, level, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullname, phone, grade_level, school, stem_strand } = req.body;
    await pool.query(
      'UPDATE users SET fullname = ?, phone = ?, grade_level = ?, school = ?, stem_strand = ? WHERE id = ?',
      [fullname, phone, grade_level, school, stem_strand, req.user.id]
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const [users] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [req.user.id]);
    if (users[0].profile_picture && users[0].profile_picture !== 'default.png') {
      const oldPath = path.join(__dirname, '../uploads/profiles', users[0].profile_picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [req.file.filename, req.user.id]);
    res.json({ message: 'Profile picture updated.', filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) return res.status(400).json({ message: 'Invalid theme.' });

    await pool.query('UPDATE users SET theme_preference = ? WHERE id = ?', [theme, req.user.id]);
    res.json({ message: `Theme changed to ${theme}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    await pool.query('UPDATE users SET notification_enabled = ? WHERE id = ?', [enabled, req.user.id]);
    res.json({ message: 'Notification settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile, uploadProfilePicture, changePassword, updateTheme, updateNotificationSettings };
