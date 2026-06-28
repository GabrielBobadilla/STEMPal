const pool = require('../config/db');

const search = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required.' });

    const offset = (page - 1) * limit;
    let results = [];
    let total = 0;

    if (!type || type === 'human' || type === 'both') {
      const [notes] = await pool.query(
        `SELECT id, title, SUBSTRING(content, 1, 200) as preview, category, source, difficulty, created_at,
          'note' as result_type FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
        ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [req.user.id, `%${q}%`, `%${q}%`, parseInt(limit), parseInt(offset)]
      );
      results = results.concat(notes);
    }

    if (!type || type === 'ai' || type === 'both') {
      const [reviewers] = await pool.query(
        `SELECT id, title, topic, reviewer_type, created_at,
          'reviewer' as result_type FROM generated_reviewers WHERE user_id = ? AND (title LIKE ? OR topic LIKE ?)
        ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [req.user.id, `%${q}%`, `%${q}%`, parseInt(limit), parseInt(offset)]
      );
      results = results.concat(reviewers);
    }

    if (!type || type === 'both') {
      const [flashcards] = await pool.query(
        `SELECT id, question as title, answer as preview, topic, difficulty, created_at,
          'flashcard' as result_type FROM flashcards WHERE user_id = ? AND (question LIKE ? OR answer LIKE ?)
        ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [req.user.id, `%${q}%`, `%${q}%`, parseInt(limit), parseInt(offset)]
      );
      results = results.concat(flashcards);
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ results, total: results.length, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { search };
