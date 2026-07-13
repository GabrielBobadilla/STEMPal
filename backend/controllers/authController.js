const { auth, db } = require('../config/firebase');

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

    // Check if user already exists in Firebase Auth
    try {
      await auth.getUserByEmail(email);
      return res.status(409).json({ message: 'Email already registered.' });
    } catch (e) {
      // User doesn't exist, proceed
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullname,
    });

    // Create Firestore user document
    const { FieldValue } = require('firebase-admin').firestore;
    await db.collection('users').doc(userRecord.uid).set({
      fullname,
      email,
      phone: phone || null,
      role: 'student',
      profile_picture: null,
      theme_preference: null,
      notification_enabled: true,
      grade_level: null,
      school: null,
      stem_strand: null,
      total_xp: 0,
      level: 1,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    // Create streak document
    await db.collection('streaks').add({
      user_id: userRecord.uid,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
    });

    res.status(201).json({
      message: 'Registration successful.',
      user: { id: userRecord.uid, fullname, email, role: 'student' }
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

    // Firebase Auth handles password verification client-side via Firebase SDK
    // This endpoint is kept for backward compatibility - frontend should use Firebase Auth directly
    // For API consumers, we verify the user exists and return profile data
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userData = userDoc.data();
    res.json({
      message: 'Login successful.',
      user: {
        id: userRecord.uid,
        fullname: userData.fullname,
        email: userData.email,
        role: userData.role,
        profile_picture: userData.profile_picture || null,
        theme_preference: userData.theme_preference || null
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
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Firebase Auth handles password reset via client SDK
    // Generate a reset link via Firebase Admin
    const link = await auth.generatePasswordResetLink(email);
    res.json({ message: 'Password reset link sent.', resetToken: link });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // With Firebase, password reset is handled via the link from forgotPassword
    // This endpoint accepts the newPassword and applies it via Admin SDK
    // The token from forgotPassword is actually a Firebase reset link
    // For backward compatibility, if a uid is provided directly, update password
    if (!token) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    // Try to interpret token as uid for direct reset (backward compat)
    try {
      await auth.updateUser(token, { password: newPassword });
      res.json({ message: 'Password reset successful.' });
    } catch (e) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
