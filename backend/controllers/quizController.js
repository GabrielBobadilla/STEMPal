const supabase = require('../config/supabase');
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

    const now = new Date().toISOString();

    const { data: quizRow } = await supabase.from('quizzes').insert({
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
      date: now,
      created_at: now
    }).select().single();

    const xpEarned = Math.round(score * 2);
    await supabase.from('xp_log').insert({ user_id: req.user.id, xp_earned: xpEarned, reason: `Quiz: ${topic}`, created_at: now });

    const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
    await supabase.from('users').update({ total_xp: (u?.total_xp || 0) + xpEarned, updated_at: now }).eq('id', req.user.id);

    await supabase.from('study_history').insert({
      user_id: req.user.id,
      activity: `Completed quiz: ${topic}`,
      activity_type: 'quiz',
      duration: time_taken || 0,
      details: { score, accuracy, total_questions },
      date: now,
      created_at: now
    });

    res.status(201).json({ message: 'Quiz submitted.', id: quizRow?.id, xp_earned: xpEarned });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = supabase.from('quizzes').select('*').eq('user_id', req.user.id).order('date', { ascending: false });
    if (limit) query = query.limit(parseInt(limit));
    const { data: quizzes } = await query;
    res.json(quizzes || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const { data: row } = await supabase.from('quizzes').select('*').eq('id', req.params.id).single();
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeakTopics = async (req, res) => {
  try {
    const { data: rows } = await supabase.from('quizzes')
      .select('weak_topics')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .limit(10);
    const weakMap = {};
    (rows || []).forEach(row => {
      const topics = row.weak_topics;
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
    const { data: quizzes } = await supabase.from('quizzes').select('*').eq('user_id', req.user.id);
    const list = quizzes || [];
    const total = list.length;
    const avgScore = total > 0 ? list.reduce((s, q) => s + (q.score || 0), 0) / total : 0;
    const avgAccuracy = total > 0 ? list.reduce((s, q) => s + (q.accuracy || 0), 0) / total : 0;
    const totalTime = list.reduce((s, q) => s + (q.time_taken || 0), 0);
    res.json({ total, avg_score: avgScore, avg_accuracy: avgAccuracy, total_time: totalTime });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateQuiz, submitQuiz, getQuizzes, getQuiz, getWeakTopics, generateAdaptiveQuiz, getQuizStats };
