const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const aiService = require('../utils/aiService');

const recommendBreak = async (req, res) => {
  try {
    const { focus_level, study_time, quiz_score } = req.body;
    const prefSnap = await db.collection('preferences').where('user_id', '==', req.user.id).limit(1).get();
    const preferences = !prefSnap.empty ? prefSnap.docs[0].data() : {};

    const recommendation = await aiService.generateBreakRecommendation(
      focus_level || 'medium', study_time || 0, quiz_score || 0, preferences
    );

    const ref = await db.collection('break_recommendations').add({
      user_id: req.user.id,
      recommendation: recommendation.recommendation,
      reason: recommendation.reason,
      benefits: recommendation.benefits || [],
      duration: recommendation.duration || 5,
      study_time: study_time || 0,
      focus_level: focus_level || 'medium',
      is_taken: false,
      created_at: FieldValue.serverTimestamp()
    });

    res.json({ id: ref.id, ...recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendation.' });
  }
};

const getBreakRecommendations = async (req, res) => {
  try {
    const snap = await db.collection('break_recommendations')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc').limit(20).get();
    const breaks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(breaks);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markBreakTaken = async (req, res) => {
  try {
    const doc = await db.collection('break_recommendations').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Break recommendation not found.' });
    }
    await doc.ref.update({ is_taken: true });
    await db.collection('study_history').add({
      user_id: req.user.id, activity: 'Took a break', activity_type: 'break',
      duration: req.body.duration || 5, date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });
    res.json({ message: 'Break marked as taken.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBreakEffectiveness = async (req, res) => {
  try {
    const snap = await db.collection('break_recommendations')
      .where('user_id', '==', req.user.id).get();
    const taken = snap.docs.filter(d => d.data().is_taken).map(d => d.data());
    const grouped = {};
    taken.forEach(b => {
      const key = b.recommendation;
      if (!grouped[key]) grouped[key] = { recommendation: key, times_taken: 0, total_duration: 0 };
      grouped[key].times_taken++;
      grouped[key].total_duration += b.duration || 0;
    });
    const stats = Object.values(grouped)
      .map(g => ({ ...g, avg_duration: g.total_duration / g.times_taken }))
      .sort((a, b) => b.times_taken - a.times_taken)
      .slice(0, 10);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { recommendBreak, getBreakRecommendations, markBreakTaken, getBreakEffectiveness };
