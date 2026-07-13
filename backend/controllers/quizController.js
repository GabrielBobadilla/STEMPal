const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const aiService = require('../utils/aiService');

const generateQuiz = async (req, res) => {
  try {
    const { topic, type, count } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });
    const questions = await aiService.generateQuiz(topic, type || 'multiple_choice', count || 10);
    res.json({ message: 'Quiz generated.', questions, topic, type: type || 'multiple_choice' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate quiz.' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { topic, quiz_type, questions, answers, score, accuracy, total_questions, correct_answers, time_taken, difficulty, weak_topics, strong_topics } = req.body;

    const ref = await db.collection('quizzes').add({
      user_id: req.user.id,
      topic,
      quiz_type,
      questions,
      answers,
      score,
      accuracy,
      total_questions,
      correct_answers,
      time_taken,
      difficulty,
      weak_topics: weak_topics || [],
      strong_topics: strong_topics || [],
      date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });

    const xpEarned = Math.round(score * 2);
    await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: xpEarned, reason: `Quiz: ${topic}`, created_at: FieldValue.serverTimestamp() });
    await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(xpEarned), updated_at: FieldValue.serverTimestamp() });

    await db.collection('study_history').add({
      user_id: req.user.id,
      activity: `Completed quiz: ${topic}`,
      activity_type: 'quiz',
      duration: time_taken || 0,
      details: { score, accuracy, total_questions },
      date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Quiz submitted.', id: ref.id, xp_earned: xpEarned });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = db.collection('quizzes').where('user_id', '==', req.user.id).orderBy('date', 'desc');
    if (limit) query = query.limit(parseInt(limit));
    const snap = await query.get();
    const quizzes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const doc = await db.collection('quizzes').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeakTopics = async (req, res) => {
  try {
    const snap = await db.collection('quizzes')
      .where('user_id', '==', req.user.id)
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    const weakMap = {};
    snap.docs.forEach(doc => {
      const topics = doc.data().weak_topics;
      if (Array.isArray(topics)) topics.forEach(t => { weakMap[t] = (weakMap[t] || 0) + 1; });
    });
    const sorted = Object.entries(weakMap).sort((a, b) => b[1] - a[1]).map(([topic, count]) => ({ topic, count }));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const generateAdaptiveQuiz = async (req, res) => {
  try {
    const { topic, weakTopics, difficulty } = req.body;
    const questions = await aiService.generateAdaptiveQuestions(topic, weakTopics || [], difficulty || 'medium');
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate adaptive quiz.' });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const snap = await db.collection('quizzes').where('user_id', '==', req.user.id).get();
    const quizzes = snap.docs.map(d => d.data());
    const total = quizzes.length;
    const avgScore = total > 0 ? quizzes.reduce((s, q) => s + (q.score || 0), 0) / total : 0;
    const avgAccuracy = total > 0 ? quizzes.reduce((s, q) => s + (q.accuracy || 0), 0) / total : 0;
    const totalTime = quizzes.reduce((s, q) => s + (q.time_taken || 0), 0);
    res.json({ total, avg_score: avgScore, avg_accuracy: avgAccuracy, total_time: totalTime });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateQuiz, submitQuiz, getQuizzes, getQuiz, getWeakTopics, generateAdaptiveQuiz, getQuizStats };
