const pool = require('../config/db');
const aiService = require('../utils/aiService');

const recommendBreak = async (req, res) => {
  try {
    const { focus_level, study_time, quiz_score } = req.body;
    const [prefs] = await pool.query('SELECT subjects, hobbies, preferred_break FROM preferences WHERE user_id = ?', [req.user.id]);
    const preferences = prefs.length > 0 ? prefs[0] : {};

    const recommendation = await aiService.generateBreakRecommendation(
      focus_level || 'medium',
      study_time || 0,
      quiz_score || 0,
      preferences
    );

    const [result] = await pool.query(
      'INSERT INTO break_recommendations (user_id, recommendation, reason, benefits, duration, study_time, focus_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, recommendation.recommendation, recommendation.reason, JSON.stringify(recommendation.benefits || []), recommendation.duration || 5, study_time || 0, focus_level || 'medium']
    );

    res.json({ id: result.insertId, ...recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendation.' });
  }
};

const getBreakRecommendations = async (req, res) => {
  try {
    const [breaks] = await pool.query(
      'SELECT * FROM break_recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(breaks);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markBreakTaken = async (req, res) => {
  try {
    await pool.query('UPDATE break_recommendations SET is_taken = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    await pool.query('INSERT INTO study_history (user_id, activity, activity_type, duration) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Took a break', 'break', req.body.duration || 5]);

    res.json({ message: 'Break marked as taken.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBreakEffectiveness = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT recommendation, COUNT(*) as times_taken, AVG(duration) as avg_duration
      FROM break_recommendations WHERE user_id = ? AND is_taken = TRUE
      GROUP BY recommendation ORDER BY times_taken DESC LIMIT 10`,
      [req.user.id]
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { recommendBreak, getBreakRecommendations, markBreakTaken, getBreakEffectiveness };
