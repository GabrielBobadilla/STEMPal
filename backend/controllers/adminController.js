const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ todayUsers }]] = await pool.query("SELECT COUNT(*) as todayUsers FROM users WHERE DATE(created_at) = CURDATE()");
    const [[{ totalReviewers }]] = await pool.query('SELECT COUNT(*) as totalReviewers FROM generated_reviewers');
    const [[{ totalQuizzes }]] = await pool.query('SELECT COUNT(*) as totalQuizzes FROM quizzes');
    const [[{ totalPDFs }]] = await pool.query('SELECT COUNT(*) as totalPDFs FROM pdf_uploads');
    const [[{ totalFlashcards }]] = await pool.query('SELECT COUNT(*) as totalFlashcards FROM flashcards');

    const [recentUsers] = await pool.query('SELECT id, fullname, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10');
    const [recentQuizzes] = await pool.query(
      'SELECT q.id, q.topic, q.score, q.date, u.fullname FROM quizzes q JOIN users u ON q.user_id = u.id ORDER BY q.date DESC LIMIT 10'
    );

    res.json({ totalUsers, todayUsers, totalReviewers, totalQuizzes, totalPDFs, totalFlashcards, recentUsers, recentQuizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT id, fullname, email, phone, role, total_xp, level, created_at FROM users';
    const params = [];

    if (search) { query += ' WHERE fullname LIKE ? OR email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM users' + (search ? ' WHERE fullname LIKE ? OR email LIKE ?' : ''),
      search ? [`%${search}%`, `%${search}%`] : []
    );

    const [users] = await pool.query(query, params);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT q.id, q.topic, q.score, q.accuracy, q.difficulty, q.date, u.fullname, u.email
      FROM quizzes q JOIN users u ON q.user_id = u.id ORDER BY q.date DESC LIMIT 50`
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserReports = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.fullname, u.email, u.total_xp, u.level,
        COALESCE(s.current_streak, 0) as current_streak,
        (SELECT COUNT(*) FROM quizzes WHERE user_id = u.id) as quiz_count,
        (SELECT COALESCE(AVG(score), 0) FROM quizzes WHERE user_id = u.id) as avg_score,
        (SELECT COUNT(*) FROM study_history WHERE user_id = u.id) as study_sessions,
        (SELECT COALESCE(SUM(duration), 0) FROM study_history WHERE user_id = u.id) as total_study_time
      FROM users u
      LEFT JOIN streaks s ON u.id = s.user_id
      ORDER BY u.total_xp DESC`
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDashboardStats, getUsers, updateUserRole, deleteUser, getQuizStats, getUserReports, deleteNote };
