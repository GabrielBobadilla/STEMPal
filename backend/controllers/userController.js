const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const { deleteFile } = require('../middleware/upload');
const { auth } = require('../config/firebase');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found.' });
    const data = userDoc.data();
    res.json({
      id: req.user.id,
      fullname: data.fullname,
      email: data.email,
      phone: data.phone,
      profile_picture: data.profile_picture,
      grade_level: data.grade_level,
      school: data.school,
      stem_strand: data.stem_strand,
      theme_preference: data.theme_preference,
      notification_enabled: data.notification_enabled,
      total_xp: data.total_xp,
      level: data.level,
      created_at: data.created_at
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullname, phone, grade_level, school, stem_strand } = req.body;
    await db.collection('users').doc(req.user.id).update({
      fullname, phone, grade_level, school, stem_strand,
      updated_at: FieldValue.serverTimestamp()
    });
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();

    if (userData.profile_picture) {
      deleteFile(userData.profile_picture);
    }

    const filename = req.file.filename;
    const filePath = `/uploads/profiles/${filename}`;

    await db.collection('users').doc(req.user.id).update({
      profile_picture: filePath,
      updated_at: FieldValue.serverTimestamp()
    });

    res.json({ message: 'Profile picture updated.', filename: filePath });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    try {
      await auth.updateUser(req.user.id, { password: newPassword });
      res.json({ message: 'Password changed successfully.' });
    } catch (e) {
      return res.status(400).json({ message: 'Failed to change password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) return res.status(400).json({ message: 'Invalid theme.' });
    await db.collection('users').doc(req.user.id).update({
      theme_preference: theme,
      updated_at: FieldValue.serverTimestamp()
    });
    res.json({ message: `Theme changed to ${theme}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    await db.collection('users').doc(req.user.id).update({
      notification_enabled: enabled,
      updated_at: FieldValue.serverTimestamp()
    });
    res.json({ message: 'Notification settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile, uploadProfilePicture, changePassword, updateTheme, updateNotificationSettings };
