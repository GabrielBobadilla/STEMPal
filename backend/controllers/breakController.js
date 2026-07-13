const supabase = require('../config/supabase');
const aiService = require('../utils/aiService');

const recommendBreak = async (req, res) => {
  try {
    const { focus_level, study_time, quiz_score } = req.body;
    const { data: prefRows } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(1);
    const preferences = prefRows && prefRows.length > 0 ? prefRows[0] : {};

    const recommendation = await aiService.generateBreakRecommendation(
      focus_level || 'medium', study_time || 0, quiz_score || 0, preferences
    );

    const { data: row } = await supabase.from('break_recommendations').insert({
      user_id: req.user.id,
      recommendation: recommendation.recommendation,
      reason: recommendation.reason,
      benefits: recommendation.benefits || [],
      duration: recommendation.duration || 5,
      study_time: study_time || 0,
      focus_level: focus_level || 'medium',
      is_taken: false,
      created_at: new Date().toISOString()
    }).select().single();

    res.json({ id: row.id, ...recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendation.' });
  }
};

const getBreakRecommendations = async (req, res) => {
  try {
    const { data: breaks } = await supabase
      .from('break_recommendations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json(breaks || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markBreakTaken = async (req, res) => {
  try {
    const { data: doc } = await supabase
      .from('break_recommendations')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!doc || doc.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Break recommendation not found.' });
    }
    await supabase.from('break_recommendations').update({ is_taken: true }).eq('id', req.params.id);
    await supabase.from('study_history').insert({
      user_id: req.user.id, activity: 'Took a break', activity_type: 'break',
      duration: req.body.duration || 5, date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    res.json({ message: 'Break marked as taken.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBreakEffectiveness = async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('break_recommendations')
      .select('*')
      .eq('user_id', req.user.id);
    const taken = (rows || []).filter(b => b.is_taken);
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
