const supabase = require('../config/supabase');

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };
const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const toDateStr = (v) => {
  if (!v) return null;
  return new Date(v).toISOString().split('T')[0];
};

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayStart();

    const { data: historyRows } = await supabase.from('study_history').select('*').eq('user_id', userId);
    let todayStudyTime = 0, sessionsCount = 0;
    const dailyMinutesMap = {};
    (historyRows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      const dayStr = toDateStr(row.date || row.created_at);
      if (dt >= today) { todayStudyTime += row.duration || 0; sessionsCount++; }
      if (dayStr) {
        const weekAgo = daysAgo(7);
        if (dt >= weekAgo) {
          if (!dailyMinutesMap[dayStr]) dailyMinutesMap[dayStr] = { day: dayStr, minutes: 0 };
          dailyMinutesMap[dayStr].minutes += row.duration || 0;
        }
      }
    });

    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', userId).limit(1).maybeSingle();

    const { data: quizzes } = await supabase.from('quizzes').select('*').eq('user_id', userId);
    const totalQuizzes = quizzes?.length || 0;
    const avgQuizScore = totalQuizzes > 0 ? quizzes.reduce((s, q) => s + (q.score || 0), 0) / totalQuizzes : 0;
    const avgAccuracy = totalQuizzes > 0 ? quizzes.reduce((s, q) => s + (q.accuracy || 0), 0) / totalQuizzes : 0;

    const { data: focusRows } = await supabase.from('focus_scores').select('*').eq('user_id', userId);
    const weekAgoDate = daysAgo(7);
    let focusSum = 0, focusCount = 0;
    (focusRows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      if (dt >= weekAgoDate) { focusSum += row.score || 0; focusCount++; }
    });

    const { data: userData } = await supabase.from('users').select('total_xp, level').eq('id', userId).single();

    res.json({
      todayStudyTime, sessionsCount,
      currentStreak: streakData?.current_streak || 0,
      longestStreak: streakData?.longest_streak || 0,
      totalQuizzes, avgQuizScore: Math.round(avgQuizScore), avgAccuracy: Math.round(avgAccuracy),
      avgFocus: focusCount > 0 ? Math.round(focusSum / focusCount) : 0,
      totalXp: userData?.total_xp || 0, level: userData?.level || 1,
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
    const { data: rows } = await supabase.from('study_history').select('*').eq('user_id', req.user.id);
    const dayMap = {};
    (rows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      if (dt >= cutoff) {
        const day = toDateStr(row.date || row.created_at);
        if (day) { if (!dayMap[day]) dayMap[day] = { date: day, minutes: 0 }; dayMap[day].minutes += row.duration || 0; }
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
    const { data: rows } = await supabase.from('quizzes').select('*').eq('user_id', req.user.id);
    const dayMap = {};
    (rows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      if (dt >= cutoff) {
        const day = toDateStr(row.date || row.created_at);
        if (day) {
          if (!dayMap[day]) dayMap[day] = { date: day, total_score: 0, count: 0 };
          dayMap[day].total_score += row.score || 0;
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
    const { data: rows } = await supabase.from('focus_scores').select('*').eq('user_id', req.user.id);
    const dayMap = {};
    (rows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      if (dt >= cutoff) {
        const day = toDateStr(row.date || row.created_at);
        if (day) {
          if (!dayMap[day]) dayMap[day] = { date: day, total: 0, count: 0 };
          dayMap[day].total += row.score || 0;
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
    const { data: rows } = await supabase.from('achievements').select('*').eq('user_id', req.user.id);
    const dayMap = {};
    (rows || []).forEach(row => {
      const dt = new Date(row.unlocked_date || row.created_at || 0);
      if (dt >= cutoff) {
        const day = toDateStr(row.unlocked_date || row.created_at);
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
    const { data: rows } = await supabase.from('break_recommendations').select('*').eq('user_id', req.user.id);
    const dayMap = {};
    (rows || []).forEach(row => {
      if (row.is_taken) {
        const dt = new Date(row.created_at || 0);
        if (dt >= cutoff) {
          const day = toDateStr(row.created_at);
          if (day) {
            if (!dayMap[day]) dayMap[day] = { date: day, breaks_taken: 0, total_duration: 0 };
            dayMap[day].breaks_taken++;
            dayMap[day].total_duration += row.duration || 0;
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
    const { data: fcRows } = await supabase.from('flashcards').select('mastery_level').eq('user_id', req.user.id);
    let mastered = 0, total = fcRows?.length || 0;
    (fcRows || []).forEach(r => { if ((r.mastery_level || 0) >= 4) mastered++; });

    const { data: qRows } = await supabase.from('quizzes').select('score').eq('user_id', req.user.id);
    const quizTotal = qRows?.length || 0;
    const avgScore = quizTotal > 0 ? qRows.reduce((s, r) => s + (r.score || 0), 0) / quizTotal : 0;

    const { data: sRows } = await supabase.from('study_history').select('date, created_at').eq('user_id', req.user.id);
    const daysActive = new Set();
    (sRows || []).forEach(r => { const day = toDateStr(r.date || r.created_at); if (day) daysActive.add(day); });

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
    const { data: sRows } = await supabase.from('study_history').select('*').eq('user_id', req.user.id);
    let totalStudyMinutes = 0;
    (sRows || []).forEach(r => { totalStudyMinutes += r.duration || 0; });

    const { data: qRows } = await supabase.from('quizzes').select('score').eq('user_id', req.user.id);
    const quizzes = qRows || [];
    const avgQuizScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizzes.length) : 0;

    const { data: fRows } = await supabase.from('focus_scores').select('score, date, created_at').eq('user_id', req.user.id).order('date', { ascending: true });
    const focusDocs = fRows || [];
    const first5 = focusDocs.slice(0, 5);
    const last5 = focusDocs.slice(-5);
    const focusImprovement = [
      { first: first5.map(d => d.score) },
      { last: last5.map(d => d.score) }
    ];

    const cutoff30 = daysAgo(30);
    let activeDaysCount = new Set(), totalSessions = 0;
    (sRows || []).forEach(r => {
      const dt = new Date(r.date || r.created_at || 0);
      if (dt >= cutoff30) { activeDaysCount.add(toDateStr(r.date || r.created_at)); totalSessions++; }
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
