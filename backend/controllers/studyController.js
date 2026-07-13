const supabase = require('../config/supabase');

const logActivity = async (req, res) => {
  try {
    const { activity, activity_type, duration, details } = req.body;
    const { data: row } = await supabase.from('study_history').insert({
      user_id: req.user.id, activity, activity_type, duration: duration || 0,
      details: details || {}, date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }).select('id').single();

    await supabase.from('xp_log').insert({ user_id: req.user.id, xp_earned: 5, reason: `Study activity: ${activity}`, created_at: new Date().toISOString() });

    const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
    await supabase.from('users').update({ total_xp: (u?.total_xp || 0) + 5, updated_at: new Date().toISOString() }).eq('id', req.user.id);

    res.status(201).json({ message: 'Activity logged.', id: row?.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    let query = supabase.from('study_history').select('*').eq('user_id', req.user.id).order('date', { ascending: false });
    if (type) query = query.eq('activity_type', type);

    const { data: rows } = await query;
    let history = rows || [];
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
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: rows } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', req.user.id);

    const todayItems = (rows || []).filter(row => {
      const date = row.date || row.created_at || '';
      return new Date(date) >= todayStart;
    });

    let total_activities = todayItems.length;
    let total_study_time = 0, quizzes_taken = 0, flashcards_reviewed = 0;
    todayItems.forEach(row => {
      total_study_time += row.duration || 0;
      if (row.activity_type === 'quiz') quizzes_taken++;
      if (row.activity_type === 'flashcard') flashcards_reviewed++;
    });
    res.json({ total_activities, total_study_time, quizzes_taken, flashcards_reviewed });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: rows } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', req.user.id);

    const dayMap = {};
    (rows || []).forEach(row => {
      const date = new Date(row.date || row.created_at || 0);
      if (date >= weekAgo) {
        const day = date.toISOString().split('T')[0];
        if (!dayMap[day]) dayMap[day] = { day, activities: 0, study_time: 0 };
        dayMap[day].activities++;
        dayMap[day].study_time += row.duration || 0;
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
    const { data: rows } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', req.user.id);

    const dayMap = {};
    (rows || []).forEach(row => {
      const date = new Date(row.date || row.created_at || 0);
      if (date >= monthAgo) {
        const day = date.toISOString().split('T')[0];
        if (!dayMap[day]) dayMap[day] = { day, activities: 0, study_time: 0 };
        dayMap[day].activities++;
        dayMap[day].study_time += row.duration || 0;
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
    const { data: rows } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', req.user.id);

    const stats = (rows || []).filter(row => {
      const dt = new Date(row.date || row.created_at || 0);
      return dt >= dayStart && dt <= dayEnd;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTotalStats = async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', req.user.id);

    const total_sessions = rows?.length || 0;
    let total_minutes = 0;
    const daysActive = new Set();
    (rows || []).forEach(row => {
      total_minutes += row.duration || 0;
      const date = row.date || row.created_at || '';
      if (date) daysActive.add(date.split('T')[0]);
    });
    res.json({ total_sessions, total_minutes, total_days_active: daysActive.size });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { logActivity, getHistory, getTodayStats, getWeeklyStats, getMonthlyStats, getDailyStats, getTotalStats };
