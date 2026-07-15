const supabase = require('../config/supabase');
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
    console.error('Generate crossword error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to generate crossword puzzle.' });
  }
};

const savePuzzleResult = async (req, res) => {
  try {
    const { puzzle_data, difficulty, score, total_words, completed_words, hints_used, time_taken, completed } = req.body;

    const { data: row } = await supabase.from('crossword_puzzles').insert({
      user_id: req.user.id, puzzle_data, difficulty, score, total_words, completed_words,
      hints_used, time_taken, completed,
      completed_at: completed ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    }).select().single();

    if (completed) {
      const xpEarned = Math.round(score * 2);
      await supabase.from('xp_log').insert({
        user_id: req.user.id, xp_earned: xpEarned,
        reason: `Crossword: ${difficulty}`, created_at: new Date().toISOString()
      });
      const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
      await supabase.from('users').update({
        total_xp: (u?.total_xp || 0) + xpEarned, updated_at: new Date().toISOString()
      }).eq('id', req.user.id);
    }

    res.status(201).json({ message: 'Puzzle result saved.', id: row.id });
  } catch (error) {
    console.error('Save crossword error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleHistory = async (req, res) => {
  try {
    const { data: puzzles } = await supabase
      .from('crossword_puzzles')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json(puzzles || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPuzzleStats = async (req, res) => {
  try {
    const { data: puzzles } = await supabase
      .from('crossword_puzzles')
      .select('score,completed')
      .eq('user_id', req.user.id);
    const total_attempts = puzzles?.length || 0;
    const completed_count = (puzzles || []).filter(p => p.completed).length;
    const total_score = (puzzles || []).reduce((s, p) => s + (p.score || 0), 0);
    const avg_score = total_attempts > 0 ? total_score / total_attempts : 0;
    res.json({ total_attempts, completed_count, avg_score, total_score });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateCrossword, savePuzzleResult, getPuzzleHistory, getPuzzleStats };
