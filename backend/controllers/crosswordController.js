const pool = require('../config/db');

const savePuzzleResult = async (req, res) => {
  try {
    const { puzzle_data, difficulty, score, total_words, completed_words, hints_used, time_taken, completed } = req.body;
    const [result] = await pool.query(
      `INSERT INTO crossword_puzzles (user_id, puzzle_data, difficulty, score, total_words, completed_words, hints_used, time_taken, completed, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${completed ? 'NOW()' : 'NULL'})`,
      [req.user.id, JSON.stringify(puzzle_data), difficulty, score, total_words, completed_words, hints_used, time_taken, completed]
    );
    if (completed) {
      const xpEarned = Math.round(score * 2);
      await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, ?, ?)', [req.user.id, xpEarned, `Crossword: ${difficulty}`]);
      await pool.query('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpEarned, req.user.id]);
    }
    res.status(201).json({ message: 'Puzzle result saved.', id: result.insertId });
  } catch (error) {
    console.error('Save crossword error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleHistory = async (req, res) => {
  try {
    const [puzzles] = await pool.query(
      'SELECT id, difficulty, score, total_words, completed_words, hints_used, time_taken, completed, completed_at, created_at FROM crossword_puzzles WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(puzzles);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      'SELECT COUNT(*) as total_attempts, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count, AVG(score) as avg_score, SUM(score) as total_score FROM crossword_puzzles WHERE user_id = ?',
      [req.user.id]
    );
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { savePuzzleResult, getPuzzleHistory, getPuzzleStats };