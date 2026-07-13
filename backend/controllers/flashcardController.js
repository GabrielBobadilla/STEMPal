const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const aiService = require('../utils/aiService');

const generateFlashcards = async (req, res) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });
    const cards = await aiService.generateFlashcards(topic, count || 10);
    const cardArray = Array.isArray(cards) ? cards : cards.flashcards || [];

    for (const card of cardArray) {
      await db.collection('flashcards').add({
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
        created_at: FieldValue.serverTimestamp()
      });
    }

    await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: 10, reason: `Generated flashcards for ${topic}`, created_at: FieldValue.serverTimestamp() });
    await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(10), updated_at: FieldValue.serverTimestamp() });

    res.status(201).json({ message: 'Flashcards generated.', count: cardArray.length, flashcards: cardArray });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards.' });
  }
};

const createFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    const ref = await db.collection('flashcards').add({
      user_id: req.user.id, question, answer, topic, difficulty: difficulty || 'medium',
      is_favorite: false, mastery_level: 0, review_count: 0,
      last_reviewed: null, next_review: null,
      created_at: FieldValue.serverTimestamp()
    });
    res.status(201).json({ message: 'Flashcard created.', id: ref.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcards = async (req, res) => {
  try {
    const { topic, difficulty, favorite } = req.query;
    let query = db.collection('flashcards').where('user_id', '==', req.user.id);
    if (topic) query = query.where('topic', '==', topic);
    if (difficulty) query = query.where('difficulty', '==', difficulty);
    if (favorite === 'true') query = query.where('is_favorite', '==', true);
    const snap = await query.orderBy('created_at', 'desc').get();
    const flashcards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcard = async (req, res) => {
  try {
    const doc = await db.collection('flashcards').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;
    const doc = await db.collection('flashcards').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    await doc.ref.update({ question, answer, topic, difficulty });
    res.json({ message: 'Flashcard updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteFlashcard = async (req, res) => {
  try {
    const doc = await db.collection('flashcards').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    await doc.ref.delete();
    res.json({ message: 'Flashcard deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const doc = await db.collection('flashcards').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    const newFav = !doc.data().is_favorite;
    await doc.ref.update({ is_favorite: newFav });
    res.json({ message: 'Favorite toggled.', is_favorite: newFav });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const reviewFlashcard = async (req, res) => {
  try {
    const { mastery } = req.body;
    const doc = await db.collection('flashcards').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Flashcard not found.' });
    }
    const data = doc.data();
    const newMastery = Math.min(5, Math.max(0, (data.mastery_level || 0) + (mastery ? 1 : -1)));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (mastery ? Math.pow(2, newMastery) : 1));
    await doc.ref.update({
      mastery_level: newMastery,
      last_reviewed: new Date().toISOString(),
      next_review: nextReview.toISOString(),
      review_count: (data.review_count || 0) + 1
    });
    res.json({ message: 'Review recorded.', mastery_level: newMastery, next_review: nextReview });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardsDue = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const snap = await db.collection('flashcards')
      .where('user_id', '==', req.user.id)
      .orderBy('mastery_level', 'asc')
      .limit(50)
      .get();
    const cards = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => !c.next_review || c.next_review <= now)
      .slice(0, 20);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFlashcardStats = async (req, res) => {
  try {
    const snap = await db.collection('flashcards').where('user_id', '==', req.user.id).get();
    let total = 0, mastered = 0, learning = 0, to_review = 0;
    snap.docs.forEach(doc => {
      total++;
      const m = doc.data().mastery_level || 0;
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
