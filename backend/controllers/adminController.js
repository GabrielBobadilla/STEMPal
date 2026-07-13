const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const { auth } = require('../config/firebase');

const getDashboardStats = async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const totalUsers = usersSnap.size;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayUsers = 0;
    usersSnap.docs.forEach(d => {
      const created = d.data().created_at?.toDate?.()?.toISOString()?.split('T')[0];
      if (created === todayStr) todayUsers++;
    });

    const totalReviewers = (await db.collection('generated_reviewers').get()).size;
    const totalQuizzes = (await db.collection('quizzes').get()).size;
    const totalPDFs = (await db.collection('pdf_uploads').get()).size;
    const totalFlashcards = (await db.collection('flashcards').get()).size;

    const recentUsersSnap = await db.collection('users').orderBy('created_at', 'desc').limit(10).get();
    const recentUsers = recentUsersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const recentQuizzesSnap = await db.collection('quizzes').orderBy('created_at', 'desc').limit(10).get();
    const recentQuizzes = [];
    for (const doc of recentQuizzesSnap.docs) {
      const qData = doc.data();
      let fullname = 'Unknown';
      try { const uDoc = await db.collection('users').doc(qData.user_id).get(); if (uDoc.exists) fullname = uDoc.data().fullname; } catch (e) {}
      recentQuizzes.push({ id: doc.id, topic: qData.topic, score: qData.score, date: qData.date, fullname });
    }

    res.json({ totalUsers, todayUsers, totalReviewers, totalQuizzes, totalPDFs, totalFlashcards, recentUsers, recentQuizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const snap = await db.collection('users').orderBy('created_at', 'desc').get();
    let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => (u.fullname || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }

    const total = users.length;
    const offset = (page - 1) * limit;
    users = users.slice(offset, offset + parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    await db.collection('users').doc(req.params.id).update({ role, updated_at: FieldValue.serverTimestamp() });
    res.json({ message: 'User role updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    await db.collection('users').doc(req.params.id).delete();
    try { await auth.deleteUser(req.params.id); } catch (e) {}
    res.json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const qSnap = await db.collection('quizzes').orderBy('created_at', 'desc').limit(50).get();
    const stats = [];
    for (const doc of qSnap.docs) {
      const qData = doc.data();
      let fullname = 'Unknown', email = '';
      try { const uDoc = await db.collection('users').doc(qData.user_id).get(); if (uDoc.exists) { fullname = uDoc.data().fullname; email = uDoc.data().email; } } catch (e) {}
      stats.push({ id: doc.id, topic: qData.topic, score: qData.score, accuracy: qData.accuracy, difficulty: qData.difficulty, date: qData.date, fullname, email });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserReports = async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const reports = [];
    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      const streakSnap = await db.collection('streaks').where('user_id', '==', uDoc.id).limit(1).get();
      const current_streak = !streakSnap.empty ? (streakSnap.docs[0].data().current_streak || 0) : 0;

      const quizSnap = await db.collection('quizzes').where('user_id', '==', uDoc.id).get();
      const quiz_count = quizSnap.size;
      const avg_score = quiz_count > 0 ? quizSnap.docs.reduce((s, d) => s + (d.data().score || 0), 0) / quiz_count : 0;

      const studySnap = await db.collection('study_history').where('user_id', '==', uDoc.id).get();
      const study_sessions = studySnap.size;
      const total_study_time = studySnap.docs.reduce((s, d) => s + (d.data().duration || 0), 0);

      reports.push({
        id: uDoc.id, fullname: uData.fullname, email: uData.email,
        total_xp: uData.total_xp || 0, level: uData.level || 1,
        current_streak, quiz_count, avg_score: Math.round(avg_score),
        study_sessions, total_study_time
      });
    }
    reports.sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNote = async (req, res) => {
  try {
    await db.collection('notes').doc(req.params.id).delete();
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDashboardStats, getUsers, updateUserRole, deleteUser, getQuizStats, getUserReports, deleteNote };
