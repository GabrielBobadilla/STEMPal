const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const { generateCrosswordData, generateAdaptiveCrossword } = require('../utils/aiService');
const { buildCrossword, validateCrossword } = require('../utils/crosswordEngine');

const generateCrossword = async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 15, mode = 'solo', weakTopics } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    let crosswordData;
    if (mode === 'adaptive' && weakTopics && weakTopics.length > 0) {
      crosswordData = await generateAdaptiveCrossword(topic, weakTopics, difficulty);
    } else {
      crosswordData = await generateCrosswordData(topic, difficulty, count);
    }

    const allWords = [...(crosswordData.across || []), ...(crosswordData.down || [])];
    if (allWords.length < 4) return res.status(422).json({ message: 'Not enough words generated. Please try again.' });

    const gridData = buildCrossword(allWords, 10);
    const validation = validateCrossword(gridData);

    const combinedAcross = gridData.across.map(a => ({ number: a.number, answer: a.answer, clue: a.clue, row: a.row, col: a.col, direction: 'across' }));
    const combinedDown = gridData.down.map(d => ({ number: d.number, answer: d.answer, clue: d.clue, row: d.row, col: d.col, direction: 'down' }));

    res.json({
      title: crosswordData.title || topic, difficulty,
      rows: gridData.rows, cols: gridData.cols, grid: gridData.grid,
      across: combinedAcross, down: combinedDown,
      totalWords: gridData.totalWords, valid: validation.valid,
    });
  } catch (error) {
    console.error('Generate crossword error:', error);
    res.status(500).json({ message: 'Failed to generate crossword puzzle.' });
  }
};

const savePuzzleResult = async (req, res) => {
  try {
    const { puzzle_data, difficulty, score, total_words, completed_words, hints_used, time_taken, completed } = req.body;

    const ref = await db.collection('crossword_puzzles').add({
      user_id: req.user.id, puzzle_data, difficulty, score, total_words, completed_words,
      hints_used, time_taken, completed,
      completed_at: completed ? new Date().toISOString() : null,
      created_at: FieldValue.serverTimestamp()
    });

    if (completed) {
      const xpEarned = Math.round(score * 2);
      await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: xpEarned, reason: `Crossword: ${difficulty}`, created_at: FieldValue.serverTimestamp() });
      await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(xpEarned), updated_at: FieldValue.serverTimestamp() });
    }

    res.status(201).json({ message: 'Puzzle result saved.', id: ref.id });
  } catch (error) {
    console.error('Save crossword error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleHistory = async (req, res) => {
  try {
    const snap = await db.collection('crossword_puzzles')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc').limit(20).get();
    const puzzles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(puzzles);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleStats = async (req, res) => {
  try {
    const snap = await db.collection('crossword_puzzles').where('user_id', '==', req.user.id).get();
    const puzzles = snap.docs.map(d => d.data());
    const total_attempts = puzzles.length;
    const completed_count = puzzles.filter(p => p.completed).length;
    const total_score = puzzles.reduce((s, p) => s + (p.score || 0), 0);
    const avg_score = total_attempts > 0 ? total_score / total_attempts : 0;
    res.json({ total_attempts, completed_count, avg_score, total_score });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateCrossword, savePuzzleResult, getPuzzleHistory, getPuzzleStats };
