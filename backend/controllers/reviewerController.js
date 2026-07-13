const supabase = require('../config/supabase');
const aiService = require('../utils/aiService');

const generateReviewer = async (req, res) => {
  try {
    const { topic, type } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required.' });

    const content = await aiService.generateReviewer(topic, type || 'basic');

    const { data: reviewer, error: insertError } = await supabase.from('generated_reviewers').insert({
      user_id: req.user.id,
      title: `Reviewer: ${topic}`,
      topic,
      reviewer_type: type || 'basic',
      content,
      created_at: new Date().toISOString()
    }).select().single();
    if (insertError) throw insertError;

    // Award XP: fetch current total_xp, then update
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', req.user.id)
      .single();
    const newTotalXp = (user?.total_xp || 0) + 25;

    await supabase.from('xp_log').insert({
      user_id: req.user.id,
      xp_earned: 25,
      reason: `Generated ${type || 'basic'} reviewer for ${topic}`,
      created_at: new Date().toISOString()
    });

    await supabase.from('users').update({
      total_xp: newTotalXp,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id);

    res.status(201).json({ message: 'Reviewer generated.', id: reviewer.id, content });
  } catch (error) {
    console.error('Generate reviewer error:', error);
    res.status(500).json({ message: 'Failed to generate reviewer.' });
  }
};

const getReviewers = async (req, res) => {
  try {
    const { data: reviewers, error } = await supabase
      .from('generated_reviewers')
      .select('id, title, topic, reviewer_type, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(reviewers || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getReviewer = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('generated_reviewers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data || data.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Reviewer not found.' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteReviewer = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('generated_reviewers')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Reviewer not found.' });
    }
    await supabase.from('generated_reviewers').delete().eq('id', req.params.id);
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
