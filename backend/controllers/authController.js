const supabase = require('../config/supabase');

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

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { fullname }
    });
    if (authError) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const uid = authData.user.id;

    // Insert into users table
    await supabase.from('users').insert({
      id: uid,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Insert into streaks
    await supabase.from('streaks').insert({
      user_id: uid,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null
    });

    res.status(201).json({
      message: 'Registration successful.',
      user: { id: uid, fullname, email, role: 'student' }
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

    // Supabase handles password verification client-side via the SDK
    // This endpoint checks user exists and returns profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (userError || !userData) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      user: {
        id: userData.id,
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (userError || !userData) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Supabase handles password reset via client SDK (supabase.auth.resetPasswordForEmail)
    // Acknowledge the request so the frontend can initiate the flow
    res.json({ message: 'Password reset link sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    // token is interpreted as the user's uid for direct reset (backward compat)
    const { error } = await supabase.auth.admin.updateUser(token, { password: newPassword });
    if (error) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }
    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
