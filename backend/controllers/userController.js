const supabase = require('../config/supabase');
const { deleteFile } = require('../middleware/upload');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'User not found.' });
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
    await supabase.from('users').update({
      fullname, phone, grade_level, school, stem_strand,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id);
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { data: userData } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', req.user.id)
      .single();

    if (userData && userData.profile_picture) {
      deleteFile(userData.profile_picture);
    }

    const filename = req.file.filename;
    const filePath = `/uploads/profiles/${filename}`;

    await supabase.from('users').update({
      profile_picture: filePath,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id);

    res.json({ message: 'Profile picture updated.', filename: filePath });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { error } = await supabase.auth.admin.updateUser(req.user.id, { password: newPassword });
    if (error) {
      return res.status(400).json({ message: 'Failed to change password.' });
    }
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) return res.status(400).json({ message: 'Invalid theme.' });
    await supabase.from('users').update({
      theme_preference: theme,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id);
    res.json({ message: `Theme changed to ${theme}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    await supabase.from('users').update({
      notification_enabled: enabled,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id);
    res.json({ message: 'Notification settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile, uploadProfilePicture, changePassword, updateTheme, updateNotificationSettings };
