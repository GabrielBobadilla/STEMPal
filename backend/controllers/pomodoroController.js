const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const saveSession = async (req, res) => {
  try {
    const { study_duration, break_duration, sessions_completed, mode } = req.body;

    const ref = await db.collection('pomodoro_sessions').add({
      user_id: req.user.id, study_duration, break_duration,
      sessions_completed: sessions_completed || 1, mode: mode || 'traditional',
      date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });

    await db.collection('study_history').add({
      user_id: req.user.id,
      activity: `Pomodoro: ${sessions_completed} sessions`,
      activity_type: 'study',
      duration: study_duration * (sessions_completed || 1),
      details: { study_duration, break_duration, sessions_completed, mode },
      date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });

    const xpEarned = (study_duration || 25) * (sessions_completed || 1);
    await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: xpEarned, reason: 'Pomodoro study session', created_at: FieldValue.serverTimestamp() });
    await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(xpEarned), updated_at: FieldValue.serverTimestamp() });

    res.status(201).json({ message: 'Session saved.', id: ref.id, xp_earned: xpEarned });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSessions = async (req, res) => {
  try {
    const snap = await db.collection('pomodoro_sessions')
      .where('user_id', '==', req.user.id)
      .orderBy('date', 'desc').limit(20).get();
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAdaptiveSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const quizSnap = await db.collection('quizzes').where('user_id', '==', userId).orderBy('date', 'desc').limit(1).get();
    const lastQuiz = !quizSnap.empty ? quizSnap.docs[0].data() : null;

    const focusSnap = await db.collection('focus_scores').where('user_id', '==', userId).get();
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); sevenDaysAgo.setHours(0,0,0,0);
    let focusTotal = 0, focusCount = 0;
    focusSnap.docs.forEach(d => {
      const dt = new Date(d.data().date || d.data().created_at?.toDate?.() || 0);
      if (dt >= sevenDaysAgo) { focusTotal += d.data().score || 0; focusCount++; }
    });

    const quizScore = lastQuiz ? (lastQuiz.score || 85) : 85;
    const focusScore = focusCount > 0 ? (focusTotal / focusCount) : 0;

    let studyMinutes = 25, breakMinutes = 5;
    if (focusScore > 85 && quizScore > 80) { studyMinutes = 35; breakMinutes = 5; }
    else if (focusScore >= 60 && quizScore >= 60) { studyMinutes = 25; breakMinutes = 5; }
    else { studyMinutes = 20; breakMinutes = 10; }

    const needsRecoveryBreak = quizScore < 50 || focusScore < 40;

    res.json({
      study_duration: studyMinutes, break_duration: breakMinutes,
      long_break_duration: Math.round(breakMinutes * 2),
      focusScore: Math.round(focusScore), quizScore: Math.round(quizScore),
      needsRecoveryBreak,
      suggestions: needsRecoveryBreak ? ['Stretch', 'Drink Water', 'Walk', 'Relax'] : []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveFocusScore = async (req, res) => {
  try {
    const { score, session_type } = req.body;
    await db.collection('focus_scores').add({
      user_id: req.user.id, score, session_type: session_type || 'study',
      date: new Date().toISOString(),
      created_at: FieldValue.serverTimestamp()
    });
    res.json({ message: 'Focus score saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { saveSession, getSessions, getAdaptiveSettings, saveFocusScore };
