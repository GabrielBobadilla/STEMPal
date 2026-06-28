const pool = require('../config/db');
const aiService = require('../utils/aiService');

const generateFlashcards = async (req, res) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const cards = await aiService.generateFlashcards(topic, count || 10);
    const cardArray = Array.isArray(cards) ? cards : cards.flashcards || [];

    const insertedIds = [];
    for (const card of cardArray) {
      const [result] = await pool.query(
        'INSERT INTO flashcards (user_id, question, answer, topic) VALUES (?, ?, ?, ?)',
        [req.user.id, card.question || card.term, card.answer || card.definition, topic]
      );
      insertedIds.push(result.insertId);
    }

    await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, 10, ?)', [req.user.id, `Generated flashcards for ${topic}`]);
    await pool.query('UPDATE users SET total_xp = total_xp + 10 WHERE id = ?', [req.user.id]);

    res.status(201).json({ message: 'Flashcards generated.', count: cardArray.length, flashcards: cardArray });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards.' });
  }
};

const createFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    const [result] = await pool.query(
      'INSERT INTO flashcards (user_id, question, answer, topic, difficulty) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, question, answer, topic, difficulty || 'medium']
    );
    res.status(201).json({ message: 'Flashcard created.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcards = async (req, res) => {
  try {
    const { topic, difficulty, favorite } = req.query;
    let query = 'SELECT * FROM flashcards WHERE user_id = ?';
    const params = [req.user.id];

    if (topic) { query += ' AND topic = ?'; params.push(topic); }
    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }
    if (favorite === 'true') { query += ' AND is_favorite = TRUE'; }

    query += ' ORDER BY created_at DESC';

    const [flashcards] = await pool.query(query, params);
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcard = async (req, res) => {
  try {
    const [cards] = await pool.query('SELECT * FROM flashcards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (cards.length === 0) return res.status(404).json({ message: 'Flashcard not found.' });
    res.json(cards[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    await pool.query(
      'UPDATE flashcards SET question = ?, answer = ?, topic = ?, difficulty = ? WHERE id = ? AND user_id = ?',
      [question, answer, topic, difficulty, req.params.id, req.user.id]
    );
    res.json({ message: 'Flashcard updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteFlashcard = async (req, res) => {
  try {
    await pool.query('DELETE FROM flashcards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Flashcard deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const [cards] = await pool.query('SELECT is_favorite FROM flashcards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (cards.length === 0) return res.status(404).json({ message: 'Flashcard not found.' });
    await pool.query('UPDATE flashcards SET is_favorite = ? WHERE id = ?', [!cards[0].is_favorite, req.params.id]);
    res.json({ message: 'Favorite toggled.', is_favorite: !cards[0].is_favorite });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const reviewFlashcard = async (req, res) => {
  try {
    const { mastery } = req.body;
    const [cards] = await pool.query('SELECT * FROM flashcards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (cards.length === 0) return res.status(404).json({ message: 'Flashcard not found.' });

    const newMastery = Math.min(5, Math.max(0, (cards[0].mastery_level || 0) + (mastery ? 1 : -1)));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (mastery ? Math.pow(2, newMastery) : 1));

    await pool.query(
      'UPDATE flashcards SET mastery_level = ?, last_reviewed = NOW(), next_review = ?, review_count = review_count + 1 WHERE id = ?',
      [newMastery, nextReview, req.params.id]
    );

    res.json({ message: 'Review recorded.', mastery_level: newMastery, next_review: nextReview });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardsDue = async (req, res) => {
  try {
    const [cards] = await pool.query(
      'SELECT * FROM flashcards WHERE user_id = ? AND (next_review IS NULL OR next_review <= NOW()) ORDER BY mastery_level ASC LIMIT 20',
      [req.user.id]
    );
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN mastery_level >= 4 THEN 1 ELSE 0 END) as mastered, SUM(CASE WHEN mastery_level >= 2 AND mastery_level < 4 THEN 1 ELSE 0 END) as learning, SUM(CASE WHEN mastery_level < 2 THEN 1 ELSE 0 END) as to_review FROM flashcards WHERE user_id = ?`,
      [req.user.id]
    );
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateFlashcards, createFlashcard, getFlashcards, getFlashcard, updateFlashcard, deleteFlashcard, toggleFavorite, reviewFlashcard, getFlashcardsDue, getFlashcardStats };
