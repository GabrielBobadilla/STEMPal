const pool = require('../config/db');
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

    const [result] = await pool.query(
      `INSERT INTO quizzes (user_id, topic, quiz_type, questions, answers, score, accuracy, total_questions, correct_answers, time_taken, difficulty, weak_topics, strong_topics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, topic, quiz_type, JSON.stringify(questions), JSON.stringify(answers), score, accuracy, total_questions, correct_answers, time_taken, difficulty, JSON.stringify(weak_topics || []), JSON.stringify(strong_topics || [])]
    );

    const xpEarned = Math.round(score * 2);
    await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, ?, ?)', [req.user.id, xpEarned, `Quiz: ${topic}`]);
    await pool.query('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpEarned, req.user.id]);

    await pool.query('INSERT INTO study_history (user_id, activity, activity_type, duration, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, `Completed quiz: ${topic}`, 'quiz', time_taken || 0, JSON.stringify({ score, accuracy, total_questions })]);

    res.status(201).json({ message: 'Quiz submitted.', id: result.insertId, xp_earned: xpEarned });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = 'SELECT id, topic, quiz_type, score, accuracy, total_questions, correct_answers, time_taken, difficulty, date FROM quizzes WHERE user_id = ? ORDER BY date DESC';
    const params = [req.user.id];
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }

    const [quizzes] = await pool.query(query, params);
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const [quizzes] = await pool.query('SELECT * FROM quizzes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz not found.' });
    const q = quizzes[0];
    q.questions = typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions;
    q.answers = typeof q.answers === 'string' ? JSON.parse(q.answers) : q.answers;
    q.weak_topics = typeof q.weak_topics === 'string' ? JSON.parse(q.weak_topics) : q.weak_topics;
    q.strong_topics = typeof q.strong_topics === 'string' ? JSON.parse(q.strong_topics) : q.strong_topics;
    res.json(q);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeakTopics = async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      'SELECT weak_topics FROM quizzes WHERE user_id = ? AND weak_topics IS NOT NULL ORDER BY date DESC LIMIT 10',
      [req.user.id]
    );
    const weakMap = {};
    quizzes.forEach(q => {
      const topics = typeof q.weak_topics === 'string' ? JSON.parse(q.weak_topics) : q.weak_topics;
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
    const [quizzes] = await pool.query(
      'SELECT COUNT(*) as total, AVG(score) as avg_score, AVG(accuracy) as avg_accuracy, SUM(time_taken) as total_time FROM quizzes WHERE user_id = ?',
      [req.user.id]
    );
    res.json(quizzes[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateQuiz, submitQuiz, getQuizzes, getQuiz, getWeakTopics, generateAdaptiveQuiz, getQuizStats };
