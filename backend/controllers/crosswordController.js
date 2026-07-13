const pool = require('../config/db');
const { generateCrosswordData, generateAdaptiveCrossword } = require('../utils/aiService');
const { buildCrossword, validateCrossword } = require('../utils/crosswordEngine');

const generateCrossword = async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 15, mode = 'solo', weakTopics } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required.' });
    }

    let crosswordData;
    if (mode === 'adaptive' && weakTopics && weakTopics.length > 0) {
      crosswordData = await generateAdaptiveCrossword(topic, weakTopics, difficulty);
    } else {
      crosswordData = await generateCrosswordData(topic, difficulty, count);
    }

    const allWords = [...(crosswordData.across || []), ...(crosswordData.down || [])];

    if (allWords.length < 4) {
      return res.status(422).json({ message: 'Not enough words generated. Please try again.' });
    }

    const gridData = buildCrossword(allWords, 10);
    const validation = validateCrossword(gridData);

    const combinedAcross = gridData.across.map(a => ({
      number: a.number,
      answer: a.answer,
      clue: a.clue,
      row: a.row,
      col: a.col,
      direction: 'across',
    }));

    const combinedDown = gridData.down.map(d => ({
      number: d.number,
      answer: d.answer,
      clue: d.clue,
      row: d.row,
      col: d.col,
      direction: 'down',
    }));

    res.json({
      title: crosswordData.title || topic,
      difficulty,
      rows: gridData.rows,
      cols: gridData.cols,
      grid: gridData.grid,
      across: combinedAcross,
      down: combinedDown,
      totalWords: gridData.totalWords,
      valid: validation.valid,
    });
  } catch (error) {
    console.error('Generate crossword error:', error);
    res.status(500).json({ message: 'Failed to generate crossword puzzle.' });
  }
};

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

module.exports = { generateCrossword, savePuzzleResult, getPuzzleHistory, getPuzzleStats };
