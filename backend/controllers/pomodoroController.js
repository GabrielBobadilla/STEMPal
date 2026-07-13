const supabase = require('../config/supabase');

const saveSession = async (req, res) => {
  try {
    const { study_duration, break_duration, sessions_completed, mode } = req.body;

    const { data: session } = await supabase.from('pomodoro_sessions').insert({
      user_id: req.user.id, study_duration, break_duration,
      sessions_completed: sessions_completed || 1, mode: mode || 'traditional',
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }).select('id').single();

    await supabase.from('study_history').insert({
      user_id: req.user.id,
      activity: `Pomodoro: ${sessions_completed} sessions`,
      activity_type: 'study',
      duration: study_duration * (sessions_completed || 1),
      details: { study_duration, break_duration, sessions_completed, mode },
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    const xpEarned = (study_duration || 25) * (sessions_completed || 1);
    await supabase.from('xp_log').insert({ user_id: req.user.id, xp_earned: xpEarned, reason: 'Pomodoro study session', created_at: new Date().toISOString() });

    const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
    await supabase.from('users').update({ total_xp: (u?.total_xp || 0) + xpEarned, updated_at: new Date().toISOString() }).eq('id', req.user.id);

    res.status(201).json({ message: 'Session saved.', id: session?.id, xp_earned: xpEarned });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getSessions = async (req, res) => {
  try {
    const { data: sessions } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .limit(20);

    res.json(sessions || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAdaptiveSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: lastQuiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: focusRows } = await supabase
      .from('focus_scores')
      .select('*')
      .eq('user_id', userId);

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); sevenDaysAgo.setHours(0, 0, 0, 0);
    let focusTotal = 0, focusCount = 0;
    (focusRows || []).forEach(row => {
      const dt = new Date(row.date || row.created_at || 0);
      if (dt >= sevenDaysAgo) { focusTotal += row.score || 0; focusCount++; }
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
    await supabase.from('focus_scores').insert({
      user_id: req.user.id, score, session_type: session_type || 'study',
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    res.json({ message: 'Focus score saved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { saveSession, getSessions, getAdaptiveSettings, saveFocusScore };
