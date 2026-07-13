const db = require('../config/db');

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };
const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const toDateStr = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate().toISOString().split('T')[0];
  return new Date(v).toISOString().split('T')[0];
};

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayStart();

    const historySnap = await db.collection('study_history').where('user_id', '==', userId).get();
    let todayStudyTime = 0, sessionsCount = 0;
    const dailyMinutesMap = {};
    historySnap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.date || data.created_at?.toDate?.() || 0);
      const dayStr = toDateStr(data.date || data.created_at);
      if (dt >= today) { todayStudyTime += data.duration || 0; sessionsCount++; }
      if (dayStr) {
        const weekAgo = daysAgo(7);
        if (dt >= weekAgo) {
          if (!dailyMinutesMap[dayStr]) dailyMinutesMap[dayStr] = { day: dayStr, minutes: 0 };
          dailyMinutesMap[dayStr].minutes += data.duration || 0;
        }
      }
    });

    const streakSnap = await db.collection('streaks').where('user_id', '==', userId).limit(1).get();
    const streakData = !streakSnap.empty ? streakSnap.docs[0].data() : {};

    const quizSnap = await db.collection('quizzes').where('user_id', '==', userId).get();
    const quizzes = quizSnap.docs.map(d => d.data());
    const totalQuizzes = quizzes.length;
    const avgQuizScore = totalQuizzes > 0 ? quizzes.reduce((s, q) => s + (q.score || 0), 0) / totalQuizzes : 0;
    const avgAccuracy = totalQuizzes > 0 ? quizzes.reduce((s, q) => s + (q.accuracy || 0), 0) / totalQuizzes : 0;

    const focusSnap = await db.collection('focus_scores').where('user_id', '==', userId).get();
    const weekAgoDate = daysAgo(7);
    let focusSum = 0, focusCount = 0;
    focusSnap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (dt >= weekAgoDate) { focusSum += data.score || 0; focusCount++; }
    });

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    res.json({
      todayStudyTime, sessionsCount,
      currentStreak: streakData.current_streak || 0,
      longestStreak: streakData.longest_streak || 0,
      totalQuizzes, avgQuizScore: Math.round(avgQuizScore), avgAccuracy: Math.round(avgAccuracy),
      avgFocus: focusCount > 0 ? Math.round(focusSum / focusCount) : 0,
      totalXp: userData.total_xp || 0, level: userData.level || 1,
      dailyMinutes: Object.values(dailyMinutesMap).sort((a, b) => a.day.localeCompare(b.day))
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStudyTimeTrend = async (req, res) => {
  try {
    const { period } = req.query;
    const days = period === 'monthly' ? 30 : period === 'yearly' ? 365 : 7;
    const cutoff = daysAgo(days);
    const snap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (dt >= cutoff) {
        const day = toDateStr(data.date || data.created_at);
        if (day) { if (!dayMap[day]) dayMap[day] = { date: day, minutes: 0 }; dayMap[day].minutes += data.duration || 0; }
      }
    });
    res.json(Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizPerformanceTrend = async (req, res) => {
  try {
    const cutoff = daysAgo(30);
    const snap = await db.collection('quizzes').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (dt >= cutoff) {
        const day = toDateStr(data.date || data.created_at);
        if (day) {
          if (!dayMap[day]) dayMap[day] = { date: day, total_score: 0, count: 0 };
          dayMap[day].total_score += data.score || 0;
          dayMap[day].count++;
        }
      }
    });
    res.json(Object.values(dayMap).map(d => ({ date: d.date, avg_score: d.total_score / d.count, count: d.count })).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getFocusTrend = async (req, res) => {
  try {
    const cutoff = daysAgo(30);
    const snap = await db.collection('focus_scores').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.date || data.created_at?.toDate?.() || 0);
      if (dt >= cutoff) {
        const day = toDateStr(data.date || data.created_at);
        if (day) {
          if (!dayMap[day]) dayMap[day] = { date: day, total: 0, count: 0 };
          dayMap[day].total += data.score || 0;
          dayMap[day].count++;
        }
      }
    });
    res.json(Object.values(dayMap).map(d => ({ date: d.date, avg_focus: d.total / d.count })).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStreakGrowth = async (req, res) => {
  try {
    const cutoff = daysAgo(30);
    const snap = await db.collection('achievements').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const dt = new Date(data.unlocked_date || data.created_at?.toDate?.() || 0);
      if (dt >= cutoff) {
        const day = toDateStr(data.unlocked_date || data.created_at);
        if (day) { if (!dayMap[day]) dayMap[day] = { date: day, achievements: 0 }; dayMap[day].achievements++; }
      }
    });
    res.json(Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBreakEffectiveness = async (req, res) => {
  try {
    const cutoff = daysAgo(30);
    const snap = await db.collection('break_recommendations').where('user_id', '==', req.user.id).get();
    const dayMap = {};
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.is_taken) {
        const dt = new Date(data.created_at?.toDate?.() || data.created_at || 0);
        if (dt >= cutoff) {
          const day = toDateStr(data.created_at);
          if (day) {
            if (!dayMap[day]) dayMap[day] = { date: day, breaks_taken: 0, total_duration: 0 };
            dayMap[day].breaks_taken++;
            dayMap[day].total_duration += data.duration || 0;
          }
        }
      }
    });
    res.json(Object.values(dayMap).map(d => ({ ...d, avg_duration: d.total_duration / d.breaks_taken })).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLearningProgress = async (req, res) => {
  try {
    const fcSnap = await db.collection('flashcards').where('user_id', '==', req.user.id).get();
    let mastered = 0, total = fcSnap.size;
    fcSnap.docs.forEach(d => { if ((d.data().mastery_level || 0) >= 4) mastered++; });

    const qSnap = await db.collection('quizzes').where('user_id', '==', req.user.id).get();
    const quizTotal = qSnap.size;
    const avgScore = quizTotal > 0 ? qSnap.docs.reduce((s, d) => s + (d.data().score || 0), 0) / quizTotal : 0;

    const sSnap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    const daysActive = new Set();
    sSnap.docs.forEach(d => { const day = toDateStr(d.data().date || d.data().created_at); if (day) daysActive.add(day); });

    res.json({
      flashcardMastery: { mastered, total },
      quizProgress: { total: quizTotal, avg_score: avgScore },
      activeDays: daysActive.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMetrics = async (req, res) => {
  try {
    const sSnap = await db.collection('study_history').where('user_id', '==', req.user.id).get();
    let totalStudyMinutes = 0;
    sSnap.docs.forEach(d => { totalStudyMinutes += d.data().duration || 0; });

    const qSnap = await db.collection('quizzes').where('user_id', '==', req.user.id).get();
    const quizzes = qSnap.docs.map(d => d.data());
    const avgQuizScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizzes.length) : 0;

    const fSnap = await db.collection('focus_scores').where('user_id', '==', req.user.id).orderBy('date', 'asc').get();
    const focusDocs = fSnap.docs.map(d => d.data());
    const first5 = focusDocs.slice(0, 5);
    const last5 = focusDocs.slice(-5);
    const focusImprovement = [
      { first: first5.map(d => d.score) },
      { last: last5.map(d => d.score) }
    ];

    const cutoff30 = daysAgo(30);
    let activeDaysCount = new Set(), totalSessions = 0;
    sSnap.docs.forEach(d => {
      const dt = new Date(d.data().date || d.data().created_at?.toDate?.() || 0);
      if (dt >= cutoff30) { activeDaysCount.add(toDateStr(d.data().date || d.data().created_at)); totalSessions++; }
    });

    res.json({
      totalStudyMinutes, averageQuizScore: avgQuizScore,
      focusImprovement,
      engagement: { active_days: activeDaysCount.size, total_sessions: totalSessions }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDashboardData, getStudyTimeTrend, getQuizPerformanceTrend, getFocusTrend, getStreakGrowth, getBreakEffectiveness, getLearningProgress, getMetrics };
