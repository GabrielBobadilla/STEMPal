const pool = require('../config/db');

const saveSession = async (req, res) => {
  try {
    const { study_duration, break_duration, sessions_completed, mode } = req.body;
    const [result] = await pool.query(
      'INSERT INTO pomodoro_sessions (user_id, study_duration, break_duration, sessions_completed, mode) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, study_duration, break_duration, sessions_completed || 1, mode || 'traditional']
    );

    await pool.query('INSERT INTO study_history (user_id, activity, activity_type, duration, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, `Pomodoro: ${sessions_completed} sessions`, 'study', study_duration * (sessions_completed || 1),
        JSON.stringify({ study_duration, break_duration, sessions_completed, mode })]);

    const xpEarned = (study_duration || 25) * (sessions_completed || 1);
    await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, ?, ?)', [req.user.id, xpEarned, 'Pomodoro study session']);
    await pool.query('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpEarned, req.user.id]);

    res.status(201).json({ message: 'Session saved.', id: result.insertId, xp_earned: xpEarned });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSessions = async (req, res) => {
  try {
    const [sessions] = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 20',
      [req.user.id]
    );
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAdaptiveSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [lastQuiz] = await pool.query(
      'SELECT score, accuracy FROM quizzes WHERE user_id = ? ORDER BY date DESC LIMIT 1',
      [userId]
    );

    const [focusData] = await pool.query(
      'SELECT COALESCE(AVG(score), 0) as avg_focus FROM focus_scores WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      [userId]
    );

    const quizScore = lastQuiz.length > 0 ? lastQuiz[0].score : 85;
    const focusScore = focusData[0].avg_focus;

    let studyMinutes = 25;
    let breakMinutes = 5;

    if (focusScore > 85 && quizScore > 80) {
      studyMinutes = 35;
      breakMinutes = 5;
    } else if (focusScore >= 60 && quizScore >= 60) {
      studyMinutes = 25;
      breakMinutes = 5;
    } else {
      studyMinutes = 20;
      breakMinutes = 10;
    }

    const needsRecoveryBreak = quizScore < 50 || focusScore < 40;

    res.json({
      studyMinutes,
      breakMinutes,
      focusScore: Math.round(focusScore),
      quizScore: Math.round(quizScore),
      needsRecoveryBreak,
      suggestions: needsRecoveryBreak ? ['Stretch', 'Drink Water', 'Walk', 'Relax'] : []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveFocusScore = async (req, res) => {
  try {
    const { score, session_type } = req.body;
    await pool.query(
      'INSERT INTO focus_scores (user_id, score, session_type) VALUES (?, ?, ?)',
      [req.user.id, score, session_type || 'study']
    );
    res.json({ message: 'Focus score saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { saveSession, getSessions, getAdaptiveSettings, saveFocusScore };
