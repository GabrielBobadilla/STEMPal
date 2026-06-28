const pool = require('../config/db');

const updateStreak = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM streaks WHERE user_id = ?', [req.user.id]);
    const today = new Date().toISOString().split('T')[0];

    if (existing.length === 0) {
      await pool.query('INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (?, 1, 1, ?)', [req.user.id, today]);
      return res.json({ current_streak: 1, longest_streak: 1, message: 'Streak started!' });
    }

    const streak = existing[0];
    const lastDate = streak.last_active_date ? new Date(streak.last_active_date).toISOString().split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === today) {
      return res.json({ current_streak: streak.current_streak, longest_streak: streak.longest_streak, message: 'Already active today.' });
    }

    let newStreak = lastDate === yesterday ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    await pool.query('UPDATE streaks SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE user_id = ?',
      [newStreak, newLongest, today, req.user.id]);

    const achievements = checkAchievements(newStreak);
    for (const badge of achievements) {
      await pool.query('INSERT IGNORE INTO achievements (user_id, badge_name, badge_type, description) VALUES (?, ?, ?, ?)',
        [req.user.id, badge.name, badge.type, badge.description]);
    }

    if (newStreak >= 3) {
      const xpBonus = newStreak * 2;
      await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, ?, ?)', [req.user.id, xpBonus, `Streak bonus: ${newStreak} days`]);
      await pool.query('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpBonus, req.user.id]);
    }

    res.json({ current_streak: newStreak, longest_streak: newLongest, achievements, message: 'Streak updated!' });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStreak = async (req, res) => {
  try {
    const [streaks] = await pool.query('SELECT * FROM streaks WHERE user_id = ?', [req.user.id]);
    if (streaks.length === 0) {
      return res.json({ current_streak: 0, longest_streak: 0 });
    }
    res.json(streaks[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkAchievements = (streak) => {
  const badges = [];
  if (streak >= 3) badges.push({ name: 'Bronze Badge', type: 'bronze', description: '3-day study streak' });
  if (streak >= 7) badges.push({ name: 'Silver Badge', type: 'silver', description: '7-day study streak' });
  if (streak >= 14) badges.push({ name: 'Gold Badge', type: 'gold', description: '14-day study streak' });
  if (streak >= 30) badges.push({ name: 'Platinum Badge', type: 'platinum', description: '30-day study streak' });
  if (streak >= 100) badges.push({ name: 'STEM Master Badge', type: 'master', description: '100-day study streak' });
  return badges;
};

module.exports = { updateStreak, getStreak };
