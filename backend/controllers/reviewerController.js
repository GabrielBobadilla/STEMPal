const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const aiService = require('../utils/aiService');

const generateReviewer = async (req, res) => {
  try {
    const { topic, type } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const content = await aiService.generateReviewer(topic, type || 'basic');

    const ref = await db.collection('generated_reviewers').add({
      user_id: req.user.id,
      title: `Reviewer: ${topic}`,
      topic,
      reviewer_type: type || 'basic',
      content,
      created_at: FieldValue.serverTimestamp()
    });

    // Award XP
    await db.collection('xp_log').add({
      user_id: req.user.id,
      xp_earned: 25,
      reason: `Generated ${type} reviewer for ${topic}`,
      created_at: FieldValue.serverTimestamp()
    });
    await db.collection('users').doc(req.user.id).update({
      total_xp: FieldValue.increment(25),
      updated_at: FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Reviewer generated.', id: ref.id, content });
  } catch (error) {
    console.error('Generate reviewer error:', error);
    res.status(500).json({ message: 'Failed to generate reviewer.' });
  }
};

const getReviewers = async (req, res) => {
  try {
    const snap = await db.collection('generated_reviewers')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();
    const reviewers = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, title: data.title, topic: data.topic, reviewer_type: data.reviewer_type, created_at: data.created_at };
    });
    res.json(reviewers);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getReviewer = async (req, res) => {
  try {
    const doc = await db.collection('generated_reviewers').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Reviewer not found.' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteReviewer = async (req, res) => {
  try {
    const doc = await db.collection('generated_reviewers').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Reviewer not found.' });
    }
    await doc.ref.delete();
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
