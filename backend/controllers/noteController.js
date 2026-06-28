const pool = require('../config/db');

const createNote = async (req, res) => {
  try {
    const { title, content, category, source, difficulty, tags } = req.body;
    const [result] = await pool.query(
      'INSERT INTO notes (user_id, title, content, category, source, difficulty, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, content, category, source || 'ai', difficulty || 'medium', JSON.stringify(tags || [])]
    );
    res.status(201).json({ message: 'Note created.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { category, source, difficulty } = req.query;
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [req.user.id];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (source) { query += ' AND source = ?'; params.push(source); }
    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }

    query += ' ORDER BY created_at DESC';

    const [notes] = await pool.query(query, params);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNote = async (req, res) => {
  try {
    const [notes] = await pool.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (notes.length === 0) return res.status(404).json({ message: 'Note not found.' });
    res.json(notes[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, category, difficulty, tags } = req.body;
    await pool.query(
      'UPDATE notes SET title = ?, content = ?, category = ?, difficulty = ?, tags = ? WHERE id = ? AND user_id = ?',
      [title, content, category, difficulty, JSON.stringify(tags || []), req.params.id, req.user.id]
    );
    res.json({ message: 'Note updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveNote = async (req, res) => {
  try {
    await pool.query('UPDATE notes SET is_saved = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Note saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSavedNotes = async (req, res) => {
  try {
    const [notes] = await pool.query('SELECT * FROM notes WHERE user_id = ? AND is_saved = TRUE ORDER BY updated_at DESC', [req.user.id]);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createNote, getNotes, getNote, updateNote, deleteNote, saveNote, getSavedNotes };
