const pool = require('../config/db');

const logActivity = async (req, res) => {
  try {
    const { activity, activity_type, duration, details } = req.body;
    const [result] = await pool.query(
      'INSERT INTO study_history (user_id, activity, activity_type, duration, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, activity, activity_type, duration || 0, JSON.stringify(details || {})]
    );

    await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, 5, ?)', [req.user.id, `Study activity: ${activity}`]);
    await pool.query('UPDATE users SET total_xp = total_xp + 5 WHERE id = ?', [req.user.id]);

    res.status(201).json({ message: 'Activity logged.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    let query = 'SELECT * FROM study_history WHERE user_id = ?';
    const params = [req.user.id];

    if (type) { query += ' AND activity_type = ?'; params.push(type); }
    query += ' ORDER BY date DESC';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    if (offset) { query += ' OFFSET ?'; params.push(parseInt(offset)); }

    const [history] = await pool.query(query, params);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTodayStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total_activities, COALESCE(SUM(duration), 0) as total_study_time,
        SUM(CASE WHEN activity_type = 'quiz' THEN 1 ELSE 0 END) as quizzes_taken,
        SUM(CASE WHEN activity_type = 'flashcard' THEN 1 ELSE 0 END) as flashcards_reviewed
      FROM study_history WHERE user_id = ? AND DATE(date) = CURDATE()`,
      [req.user.id]
    );
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT DATE(date) as day, COUNT(*) as activities, COALESCE(SUM(duration), 0) as study_time
      FROM study_history WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date) ORDER BY day`,
      [req.user.id]
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT DATE(date) as day, COUNT(*) as activities, COALESCE(SUM(duration), 0) as study_time
      FROM study_history WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(date) ORDER BY day`,
      [req.user.id]
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const [stats] = await pool.query(
      `SELECT * FROM study_history WHERE user_id = ? AND DATE(date) = ? ORDER BY date DESC`,
      [req.user.id, targetDate]
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTotalStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total_sessions, COALESCE(SUM(duration), 0) as total_minutes,
        COUNT(DISTINCT DATE(date)) as total_days_active
      FROM study_history WHERE user_id = ?`,
      [req.user.id]
    );
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { logActivity, getHistory, getTodayStats, getWeeklyStats, getMonthlyStats, getDailyStats, getTotalStats };
