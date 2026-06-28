const pool = require('../config/db');

const getLeaderboard = async (req, res) => {
  try {
    const { period, limit = 20 } = req.query;

    if (period === 'weekly') {
      const [data] = await pool.query(
        `SELECT u.id, u.fullname, u.profile_picture,
          COALESCE(SUM(x.xp_earned), 0) as xp_earned
        FROM users u
        LEFT JOIN xp_log x ON u.id = x.user_id AND x.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY u.id, u.fullname, u.profile_picture
        ORDER BY xp_earned DESC LIMIT ?`,
        [parseInt(limit)]
      );
      return res.json(data);
    }

    if (period === 'monthly') {
      const [data] = await pool.query(
        `SELECT u.id, u.fullname, u.profile_picture,
          COALESCE(SUM(x.xp_earned), 0) as xp_earned
        FROM users u
        LEFT JOIN xp_log x ON u.id = x.user_id AND x.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY u.id, u.fullname, u.profile_picture
        ORDER BY xp_earned DESC LIMIT ?`,
        [parseInt(limit)]
      );
      return res.json(data);
    }

    const [data] = await pool.query(
      'SELECT id, fullname, profile_picture, total_xp, level FROM users ORDER BY total_xp DESC LIMIT ?',
      [parseInt(limit)]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserRanking = async (req, res) => {
  try {
    const [allUsers] = await pool.query(
      'SELECT id, total_xp FROM users ORDER BY total_xp DESC'
    );
    const rank = allUsers.findIndex(u => u.id === req.user.id) + 1;
    const total = allUsers.length;
    const user = allUsers.find(u => u.id === req.user.id);

    res.json({ rank, total, total_xp: user?.total_xp || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLevelInfo = async (req, res) => {
  try {
    const [levels] = await pool.query('SELECT * FROM levels ORDER BY min_xp ASC');
    const [user] = await pool.query('SELECT total_xp, level FROM users WHERE id = ?', [req.user.id]);

    const currentLevel = levels.find(l => user[0]?.total_xp >= l.min_xp && user[0]?.total_xp <= l.max_xp) || levels[0];
    const nextLevel = levels[levels.indexOf(currentLevel) + 1];

    res.json({
      currentXp: user[0]?.total_xp || 0,
      currentLevel: currentLevel?.level_name || 'Beginner',
      currentLevelNum: user[0]?.level || 1,
      minXp: currentLevel?.min_xp || 0,
      maxXp: currentLevel?.max_xp || 99,
      nextLevelName: nextLevel?.level_name || 'Max level',
      nextLevelXp: nextLevel?.min_xp || currentLevel?.max_xp || 99,
      progress: nextLevel ? ((user[0]?.total_xp - currentLevel.min_xp) / (nextLevel.min_xp - currentLevel.min_xp)) * 100 : 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getXpHistory = async (req, res) => {
  try {
    const [logs] = await pool.query(
      'SELECT * FROM xp_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkLevelUp = async (req, res) => {
  try {
    const [user] = await pool.query('SELECT total_xp, level FROM users WHERE id = ?', [req.user.id]);
    const [levels] = await pool.query('SELECT * FROM levels ORDER BY min_xp ASC');

    let newLevel = 1;
    for (const l of levels) {
      if (user[0].total_xp >= l.min_xp) newLevel = levels.indexOf(l) + 1;
    }

    if (newLevel > user[0].level) {
      await pool.query('UPDATE users SET level = ? WHERE id = ?', [newLevel, req.user.id]);
      return res.json({ leveledUp: true, newLevel, levelName: levels[newLevel - 1]?.level_name });
    }

    res.json({ leveledUp: false, currentLevel: user[0].level });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLeaderboard, getUserRanking, getLevelInfo, getXpHistory, checkLevelUp };
