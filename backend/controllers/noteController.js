const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const createNote = async (req, res) => {
  try {
    const { title, content, category, source, difficulty, tags } = req.body;
    const ref = await db.collection('notes').add({
      user_id: req.user.id,
      title,
      content,
      category,
      source: source || 'ai',
      difficulty: difficulty || 'medium',
      tags: tags || [],
      is_saved: false,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });
    res.status(201).json({ message: 'Note created.', id: ref.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { category, source, difficulty } = req.query;
    let query = db.collection('notes').where('user_id', '==', req.user.id);

    if (category) query = query.where('category', '==', category);
    if (source) query = query.where('source', '==', source);
    if (difficulty) query = query.where('difficulty', '==', difficulty);

    const snap = await query.orderBy('created_at', 'desc').get();
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNote = async (req, res) => {
  try {
    const doc = await db.collection('notes').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Note not found.' });
    const data = doc.data();
    if (data.user_id !== req.user.id) return res.status(404).json({ message: 'Note not found.' });
    res.json({ id: doc.id, ...data });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, category, difficulty, tags } = req.body;
    const doc = await db.collection('notes').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await doc.ref.update({
      title, content, category, difficulty, tags: tags || [],
      updated_at: FieldValue.serverTimestamp()
    });
    res.json({ message: 'Note updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const doc = await db.collection('notes').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await doc.ref.delete();
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveNote = async (req, res) => {
  try {
    const doc = await db.collection('notes').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await doc.ref.update({ is_saved: true, updated_at: FieldValue.serverTimestamp() });
    res.json({ message: 'Note saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSavedNotes = async (req, res) => {
  try {
    const snap = await db.collection('notes')
      .where('user_id', '==', req.user.id)
      .where('is_saved', '==', true)
      .orderBy('updated_at', 'desc')
      .get();
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createNote, getNotes, getNote, updateNote, deleteNote, saveNote, getSavedNotes };
