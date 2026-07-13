const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const logActivity = async (req, res) => {
  try {
    const { activity, activity_type, duration, details } = req.body;
    const ref = await db.collection('study_history').add({
      user_id: req.user.id, activity, activity_type, duration: duration || 0,
      details: details || {}, date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });
    await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: 5, reason: `Study activity: ${activity}`, created_at: FieldValue.serverTimestamp() });
    await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(5), updated_at: FieldValue.serverTimestamp() });
    res.status(201).json({ message: 'Activity logged.', id: ref.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    let query = db.collection('study_history').where('user_id', '==', req.user.id).orderBy('date', 'desc');
    if (type) query = query.where('activity_type', '==', type);
    const snap = await query.get();
    let history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const lim = parseInt(limit) || history.length;
    const off = parseInt(offset) || 0;
    history = history.slice(off, off + lim);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTodayStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const todayItems = snap.docs.filter(d => {
      const date = d.data().date || d.data().created_at?.toDate?.()?.toISOString() || '';
      return new Date(date) >= todayStart;
    });
    let total_activities = todayItems.length;
    let total_study_time = 0, quizzes_taken = 0, flashcards_reviewed = 0;
    todayItems.forEach(d => {
      const data = d.data();
      total_study_time += data.duration || 0;
      if (data.activity_type === 'quiz') quizzes_taken++;
      if (data.activity_type === 'flashcard') flashcards_reviewed++;
    });
    res.json({ total_activities, total_study_time, quizzes_taken, flashcards_reviewed });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const date = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (date >= weekAgo) {
        const day = date.toISOString().split('T')[0];
        if (!dayMap[day]) dayMap[day] = { day, activities: 0, study_time: 0 };
        dayMap[day].activities++;
        dayMap[day].study_time += data.duration || 0;
      }
    });
    res.json(Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const date = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (date >= monthAgo) {
        const day = date.toISOString().split('T')[0];
        if (!dayMap[day]) dayMap[day] = { day, activities: 0, study_time: 0 };
        dayMap[day].activities++;
        dayMap[day].study_time += data.duration || 0;
      }
    });
    res.json(Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDate + 'T00:00:00');
    const dayEnd = new Date(targetDate + 'T23:59:59');
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const stats = snap.docs.filter(d => {
      const dt = new Date(d.data().date || d.data().created_at?.toDate?.() || 0);
      return dt >= dayStart && dt <= dayEnd;
    }).map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTotalStats = async (req, res) => {
  try {
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const total_sessions = snap.size;
    let total_minutes = 0;
    const daysActive = new Set();
    snap.docs.forEach(d => {
      const data = d.data();
      total_minutes += data.duration || 0;
      const date = data.date || data.created_at?.toDate?.()?.toISOString() || '';
      if (date) daysActive.add(date.split('T')[0]);
    });
    res.json({ total_sessions, total_minutes, total_days_active: daysActive.size });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { logActivity, getHistory, getTodayStats, getWeeklyStats, getMonthlyStats, getDailyStats, getTotalStats };
