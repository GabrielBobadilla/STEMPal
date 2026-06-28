const pool = require('../config/db');
const aiService = require('../utils/aiService');

const generateReviewer = async (req, res) => {
  try {
    const { topic, type } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const content = await aiService.generateReviewer(topic, type || 'basic');

    const [result] = await pool.query(
      'INSERT INTO generated_reviewers (user_id, title, topic, reviewer_type, content) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, `Reviewer: ${topic}`, topic, type || 'basic', JSON.stringify(content)]
    );

    await pool.query(
      'INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, 25, ?)',
      [req.user.id, `Generated ${type} reviewer for ${topic}`]
    );
    await pool.query('UPDATE users SET total_xp = total_xp + 25 WHERE id = ?', [req.user.id]);

    res.status(201).json({ message: 'Reviewer generated.', id: result.insertId, content });
  } catch (error) {
    console.error('Generate reviewer error:', error);
    res.status(500).json({ message: 'Failed to generate reviewer.' });
  }
};

const getReviewers = async (req, res) => {
  try {
    const [reviewers] = await pool.query(
      'SELECT id, title, topic, reviewer_type, created_at FROM generated_reviewers WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(reviewers);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getReviewer = async (req, res) => {
  try {
    const [reviewers] = await pool.query('SELECT * FROM generated_reviewers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (reviewers.length === 0) return res.status(404).json({ message: 'Reviewer not found.' });
    reviewers[0].content = typeof reviewers[0].content === 'string' ? JSON.parse(reviewers[0].content) : reviewers[0].content;
    res.json(reviewers[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteReviewer = async (req, res) => {
  try {
    await pool.query('DELETE FROM generated_reviewers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Reviewer deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const generateFormulaSheet = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const formulas = await aiService.generateFormulaSheet(topic);
    res.json({ formulas });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate formula sheet.' });
  }
};

const generateKeyTerms = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const terms = await aiService.generateKeyTerms(topic);
    res.json({ terms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate key terms.' });
  }
};

module.exports = { generateReviewer, getReviewers, getReviewer, deleteReviewer, generateFormulaSheet, generateKeyTerms };
