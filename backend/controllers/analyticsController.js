const pool = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [todayStats] = await pool.query(
      `SELECT COALESCE(SUM(duration), 0) as total_study_time,
        COUNT(*) as sessions_count
      FROM study_history WHERE user_id = ? AND DATE(date) = CURDATE()`,
      [userId]
    );

    const [streakData] = await pool.query('SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?', [userId]);

    const [quizStats] = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(AVG(score), 0) as avg_score,
        COALESCE(AVG(accuracy), 0) as avg_accuracy
      FROM quizzes WHERE user_id = ?`,
      [userId]
    );

    const [focusData] = await pool.query(
      'SELECT COALESCE(AVG(score), 0) as avg_focus FROM focus_scores WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      [userId]
    );

    const [userData] = await pool.query('SELECT total_xp, level FROM users WHERE id = ?', [userId]);

    const [dailyMinutes] = await pool.query(
      `SELECT DATE(date) as day, COALESCE(SUM(duration), 0) as minutes
      FROM study_history WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date) ORDER BY day`,
      [userId]
    );

    res.json({
      todayStudyTime: todayStats[0].total_study_time,
      sessionsCount: todayStats[0].sessions_count,
      currentStreak: streakData[0]?.current_streak || 0,
      longestStreak: streakData[0]?.longest_streak || 0,
      totalQuizzes: quizStats[0].total,
      avgQuizScore: Math.round(quizStats[0].avg_score || 0),
      avgAccuracy: Math.round(quizStats[0].avg_accuracy || 0),
      avgFocus: Math.round(focusData[0].avg_focus || 0),
      totalXp: userData[0]?.total_xp || 0,
      level: userData[0]?.level || 1,
      dailyMinutes
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStudyTimeTrend = async (req, res) => {
  try {
    const { period } = req.query;
    const days = period === 'monthly' ? 30 : period === 'yearly' ? 365 : 7;

    const [data] = await pool.query(
      `SELECT DATE(date) as date, COALESCE(SUM(duration), 0) as minutes
      FROM study_history WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(date) ORDER BY date`,
      [req.user.id, days]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizPerformanceTrend = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT DATE(date) as date, AVG(score) as avg_score, COUNT(*) as count
      FROM quizzes WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(date) ORDER BY date`,
      [req.user.id]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFocusTrend = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT DATE(date) as date, AVG(score) as avg_focus
      FROM focus_scores WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(date) ORDER BY date`,
      [req.user.id]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStreakGrowth = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT DATE(unlocked_date) as date, COUNT(*) as achievements
      FROM achievements WHERE user_id = ? AND unlocked_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(unlocked_date) ORDER BY date`,
      [req.user.id]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBreakEffectiveness = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as breaks_taken,
        AVG(duration) as avg_duration
      FROM break_recommendations WHERE user_id = ? AND is_taken = TRUE
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY date`,
      [req.user.id]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLearningProgress = async (req, res) => {
  try {
    const [flashcardStats] = await pool.query(
      `SELECT SUM(CASE WHEN mastery_level >= 4 THEN 1 ELSE 0 END) as mastered,
        COUNT(*) as total FROM flashcards WHERE user_id = ?`,
      [req.user.id]
    );

    const [quizProgress] = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(AVG(score), 0) as avg_score
      FROM quizzes WHERE user_id = ?`,
      [req.user.id]
    );

    const [studyDays] = await pool.query(
      'SELECT COUNT(DISTINCT DATE(date)) as days FROM study_history WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      flashcardMastery: flashcardStats[0],
      quizProgress: quizProgress[0],
      activeDays: studyDays[0].days
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMetrics = async (req, res) => {
  try {
    const [totalStudyTime] = await pool.query(
      'SELECT COALESCE(SUM(duration), 0) as total FROM study_history WHERE user_id = ?',
      [req.user.id]
    );
    const [avgQuizScore] = await pool.query(
      'SELECT COALESCE(AVG(score), 0) as avg FROM quizzes WHERE user_id = ?',
      [req.user.id]
    );
    const [focusImprovement] = await pool.query(
      `SELECT MIN(score) as first_focus, MAX(score) as last_focus FROM (
        SELECT score FROM focus_scores WHERE user_id = ? ORDER BY date ASC LIMIT 5
      ) as first
      UNION ALL
      SELECT MIN(score), MAX(score) FROM (
        SELECT score FROM focus_scores WHERE user_id = ? ORDER BY date DESC LIMIT 5
      ) as last`,
      [req.user.id, req.user.id]
    );

    const [engagement] = await pool.query(
      `SELECT COUNT(DISTINCT DATE(date)) as active_days,
        COUNT(*) as total_sessions
      FROM study_history WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [req.user.id]
    );

    res.json({
      totalStudyMinutes: totalStudyTime[0].total,
      averageQuizScore: Math.round(avgQuizScore[0].avg || 0),
      focusImprovement: focusImprovement,
      engagement: engagement[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDashboardData, getStudyTimeTrend, getQuizPerformanceTrend, getFocusTrend, getStreakGrowth, getBreakEffectiveness, getLearningProgress, getMetrics };
