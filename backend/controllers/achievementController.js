const pool = require('../config/db');

const getAchievements = async (req, res) => {
  try {
    const [achievements] = await pool.query(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_date DESC',
      [req.user.id]
    );
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkAndAward = async (req, res) => {
  try {
    const [stats] = await pool.query(
      'SELECT COUNT(*) as quiz_count, COALESCE(AVG(score), 0) as avg_score FROM quizzes WHERE user_id = ?',
      [req.user.id]
    );
    const [streakData] = await pool.query('SELECT current_streak FROM streaks WHERE user_id = ?', [req.user.id]);
    const [xpData] = await pool.query('SELECT total_xp FROM users WHERE id = ?', [req.user.id]);

    const streak = streakData.length > 0 ? streakData[0].current_streak : 0;
    const totalXp = xpData[0]?.total_xp || 0;
    const newBadges = [];

    if (stats[0].quiz_count >= 10) {
      const [exists] = await pool.query('SELECT id FROM achievements WHERE user_id = ? AND badge_name = ?', [req.user.id, 'Quiz Master']);
      if (exists.length === 0) {
        await pool.query('INSERT INTO achievements (user_id, badge_name, badge_type, description) VALUES (?, ?, ?, ?)',
          [req.user.id, 'Quiz Master', 'gold', 'Completed 10 quizzes']);
        newBadges.push({ name: 'Quiz Master', type: 'gold' });
      }
    }

    if (totalXp >= 1000) {
      const [exists] = await pool.query('SELECT id FROM achievements WHERE user_id = ? AND badge_name = ?', [req.user.id, 'XP Champion']);
      if (exists.length === 0) {
        await pool.query('INSERT INTO achievements (user_id, badge_name, badge_type, description) VALUES (?, ?, ?, ?)',
          [req.user.id, 'XP Champion', 'platinum', 'Earned 1000 XP']);
        newBadges.push({ name: 'XP Champion', type: 'platinum' });
      }
    }

    res.json({ newBadges, total: newBadges.length > 0 ? 'New achievements unlocked!' : 'No new achievements.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAchievements, checkAndAward };
