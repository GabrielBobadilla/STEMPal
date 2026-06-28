const pool = require('../config/db');

const savePreferences = async (req, res) => {
  try {
    const { subjects, hobbies, learning_style, study_duration, preferred_break, study_goals, grade_level, school, stem_strand } = req.body;
    const userId = req.user.id;

    const [existing] = await pool.query('SELECT id FROM preferences WHERE user_id = ?', [userId]);

    if (existing.length > 0) {
      await pool.query(
        `UPDATE preferences SET subjects = ?, hobbies = ?, learning_style = ?, study_duration = ?, preferred_break = ?, study_goals = ? WHERE user_id = ?`,
        [JSON.stringify(subjects), JSON.stringify(hobbies), learning_style, study_duration, JSON.stringify(preferred_break), study_goals, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO preferences (user_id, subjects, hobbies, learning_style, study_duration, preferred_break, study_goals) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, JSON.stringify(subjects), JSON.stringify(hobbies), learning_style, study_duration, JSON.stringify(preferred_break), study_goals]
      );
    }

    if (grade_level || school || stem_strand) {
      await pool.query(
        'UPDATE users SET grade_level = COALESCE(?, grade_level), school = COALESCE(?, school), stem_strand = COALESCE(?, stem_strand) WHERE id = ?',
        [grade_level || null, school || null, stem_strand || null, userId]
      );
    }

    res.json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPreferences = async (req, res) => {
  try {
    const [prefs] = await pool.query('SELECT * FROM preferences WHERE user_id = ?', [req.user.id]);
    if (prefs.length === 0) return res.status(404).json({ message: 'No preferences found.' });

    const pref = prefs[0];
    pref.subjects = JSON.parse(pref.subjects || '[]');
    pref.hobbies = JSON.parse(pref.hobbies || '[]');
    pref.preferred_break = JSON.parse(pref.preferred_break || '[]');

    res.json(pref);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkPreferences = async (req, res) => {
  try {
    const [prefs] = await pool.query('SELECT id FROM preferences WHERE user_id = ?', [req.user.id]);
    res.json({ hasPreferences: prefs.length > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { savePreferences, getPreferences, checkPreferences };
