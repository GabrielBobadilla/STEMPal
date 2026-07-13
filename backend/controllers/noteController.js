const supabase = require('../config/supabase');

const createNote = async (req, res) => {
  try {
    const { title, content, category, source, difficulty, tags } = req.body;
    const { data, error } = await supabase.from('notes').insert({
      user_id: req.user.id,
      title,
      content,
      category,
      source: source || 'ai',
      difficulty: difficulty || 'medium',
      tags: tags || [],
      is_saved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Note created.', id: data.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { category, source, difficulty } = req.query;
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.user.id);

    if (category) query = query.eq('category', category);
    if (source) query = query.eq('source', source);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data: notes, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(notes || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getNote = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Note not found.' });
    if (data.user_id !== req.user.id) return res.status(404).json({ message: 'Note not found.' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, category, difficulty, tags } = req.body;
    const { data: existing } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await supabase.from('notes').update({
      title, content, category, difficulty, tags: tags || [],
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id);
    res.json({ message: 'Note updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await supabase.from('notes').delete().eq('id', req.params.id);
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveNote = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await supabase.from('notes').update({
      is_saved: true,
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id);
    res.json({ message: 'Note saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSavedNotes = async (req, res) => {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_saved', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(notes || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createNote, getNotes, getNote, updateNote, deleteNote, saveNote, getSavedNotes };
