const supabase = require('../config/supabase');

const getDashboardStats = async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('*');
    const totalUsers = users?.length || 0;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayUsers = 0;
    (users || []).forEach(u => {
      const created = new Date(u.created_at || 0).toISOString().split('T')[0];
      if (created === todayStr) todayUsers++;
    });

    const { count: totalReviewers } = await supabase.from('generated_reviewers').select('*', { count: 'exact', head: true });
    const { count: totalQuizzes } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
    const { count: totalPDFs } = await supabase.from('pdf_uploads').select('*', { count: 'exact', head: true });
    const { count: totalFlashcards } = await supabase.from('flashcards').select('*', { count: 'exact', head: true });

    const { data: recentUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10);

    const { data: recentQuizzesRaw } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false }).limit(10);
    const recentQuizzes = [];
    for (const q of (recentQuizzesRaw || [])) {
      let fullname = 'Unknown';
      try {
        const { data: u } = await supabase.from('users').select('fullname').eq('id', q.user_id).single();
        if (u) fullname = u.fullname;
      } catch (e) {}
      recentQuizzes.push({ id: q.id, topic: q.topic, score: q.score, date: q.date, fullname });
    }

    res.json({ totalUsers, todayUsers, totalReviewers, totalQuizzes, totalPDFs, totalFlashcards, recentUsers, recentQuizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

    let filtered = users || [];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u => (u.fullname || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    filtered = filtered.slice(offset, offset + parseInt(limit));

    res.json({ users: filtered, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    await supabase.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ message: 'User role updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    await supabase.from('users').delete().eq('id', req.params.id);
    try { await supabase.auth.admin.deleteUser(req.params.id); } catch (e) {}
    res.json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const { data: quizzes } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false }).limit(50);
    const stats = [];
    for (const q of (quizzes || [])) {
      let fullname = 'Unknown', email = '';
      try {
        const { data: u } = await supabase.from('users').select('fullname, email').eq('id', q.user_id).single();
        if (u) { fullname = u.fullname; email = u.email; }
      } catch (e) {}
      stats.push({ id: q.id, topic: q.topic, score: q.score, accuracy: q.accuracy, difficulty: q.difficulty, date: q.date, fullname, email });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserReports = async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('*');
    const reports = [];
    for (const u of (users || [])) {
      const { data: streakRow } = await supabase.from('streaks').select('current_streak').eq('user_id', u.id).limit(1).maybeSingle();
      const current_streak = streakRow?.current_streak || 0;

      const { data: quizRows } = await supabase.from('quizzes').select('score').eq('user_id', u.id);
      const quiz_count = quizRows?.length || 0;
      const avg_score = quiz_count > 0 ? quizRows.reduce((s, d) => s + (d.score || 0), 0) / quiz_count : 0;

      const { data: studyRows } = await supabase.from('study_history').select('duration').eq('user_id', u.id);
      const study_sessions = studyRows?.length || 0;
      const total_study_time = (studyRows || []).reduce((s, d) => s + (d.duration || 0), 0);

      reports.push({
        id: u.id, fullname: u.fullname, email: u.email,
        total_xp: u.total_xp || 0, level: u.level || 1,
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
    await supabase.from('notes').delete().eq('id', req.params.id);
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDashboardStats, getUsers, updateUserRole, deleteUser, getQuizStats, getUserReports, deleteNote };
