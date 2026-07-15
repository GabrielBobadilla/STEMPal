const supabase = require('../config/supabase');
const aiService = require('../utils/aiService');

const generateFlashcards = async (req, res) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });
    const cards = await aiService.generateFlashcards(topic, count || 10);
    const cardArray = Array.isArray(cards) ? cards : cards.flashcards || [];

    const now = new Date().toISOString();

    for (const card of cardArray) {
      await supabase.from('flashcards').insert({
        user_id: req.user.id,
        question: card.question || card.term,
        answer: card.answer || card.definition,
        topic,
        difficulty: 'medium',
        is_favorite: false,
        mastery_level: 0,
        review_count: 0,
        last_reviewed: null,
        next_review: null,
        created_at: now
      });
    }

    await supabase.from('xp_log').insert({ user_id: req.user.id, xp_earned: 10, reason: `Generated flashcards for ${topic}`, created_at: now });
    const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
    await supabase.from('users').update({ total_xp: (u?.total_xp || 0) + 10, updated_at: now }).eq('id', req.user.id);

    res.status(201).json({ message: 'Flashcards generated.', count: cardArray.length, flashcards: cardArray });
  } catch (error) {
    console.error('Generate flashcards error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to generate flashcards.' });
  }
};

const createFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    const { data: row } = await supabase.from('flashcards').insert({
      user_id: req.user.id, question, answer, topic, difficulty: difficulty || 'medium',
      is_favorite: false, mastery_level: 0, review_count: 0,
      last_reviewed: null, next_review: null,
      created_at: new Date().toISOString()
    }).select().single();
    res.status(201).json({ message: 'Flashcard created.', id: row?.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcards = async (req, res) => {
  try {
    const { topic, difficulty, favorite } = req.query;
    let query = supabase.from('flashcards').select('*').eq('user_id', req.user.id);
    if (topic) query = query.eq('topic', topic);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (favorite === 'true') query = query.eq('is_favorite', true);
    const { data: flashcards } = await query.order('created_at', { ascending: false });
    res.json(flashcards || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcard = async (req, res) => {
  try {
    const { data: row } = await supabase.from('flashcards').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    const { data: row } = await supabase.from('flashcards').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    await supabase.from('flashcards').update({ question, answer, topic, difficulty }).eq('id', req.params.id);
    res.json({ message: 'Flashcard updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteFlashcard = async (req, res) => {
  try {
    const { data: row } = await supabase.from('flashcards').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    await supabase.from('flashcards').delete().eq('id', req.params.id);
    res.json({ message: 'Flashcard deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { data: row } = await supabase.from('flashcards').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    const newFav = !row.is_favorite;
    await supabase.from('flashcards').update({ is_favorite: newFav }).eq('id', req.params.id);
    res.json({ message: 'Favorite toggled.', is_favorite: newFav });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const reviewFlashcard = async (req, res) => {
  try {
    const { mastery } = req.body;
    const { data: row } = await supabase.from('flashcards').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    const newMastery = Math.min(5, Math.max(0, (row.mastery_level || 0) + (mastery ? 1 : -1)));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (mastery ? Math.pow(2, newMastery) : 1));
    await supabase.from('flashcards').update({
      mastery_level: newMastery,
      last_reviewed: new Date().toISOString(),
      next_review: nextReview.toISOString(),
      review_count: (row.review_count || 0) + 1
    }).eq('id', req.params.id);
    res.json({ message: 'Review recorded.', mastery_level: newMastery, next_review: nextReview });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardsDue = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data: rows } = await supabase.from('flashcards')
      .select('*')
      .eq('user_id', req.user.id)
      .order('mastery_level', { ascending: true })
      .limit(50);
    const cards = (rows || [])
      .filter(c => !c.next_review || c.next_review <= now)
      .slice(0, 20);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardStats = async (req, res) => {
  try {
    const { data: rows } = await supabase.from('flashcards').select('*').eq('user_id', req.user.id);
    let total = 0, mastered = 0, learning = 0, to_review = 0;
    (rows || []).forEach(row => {
      total++;
      const m = row.mastery_level || 0;
      if (m >= 4) mastered++;
      else if (m >= 2) learning++;
      else to_review++;
    });
    res.json({ total, mastered, learning, to_review });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateFlashcards, createFlashcard, getFlashcards, getFlashcard, updateFlashcard, deleteFlashcard, toggleFavorite, reviewFlashcard, getFlashcardsDue, getFlashcardStats };
