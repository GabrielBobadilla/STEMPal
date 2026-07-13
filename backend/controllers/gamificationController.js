const supabase = require('../config/supabase');

const getLeaderboard = async (req, res) => {
  try {
    const { period, limit = 20 } = req.query;
    const lim = parseInt(limit);

    if (period === 'weekly' || period === 'monthly') {
      const days = period === 'weekly' ? 7 : 30;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0,0,0,0);
      const { data: users } = await supabase.from('users').select('id, fullname, profile_picture');
      const data = [];
      for (const u of (users || [])) {
        const { data: xpRows } = await supabase.from('xp_log').select('*').eq('user_id', u.id);
        let xpEarned = 0;
        (xpRows || []).forEach(row => {
          const created = new Date(row.created_at || 0);
          if (created >= cutoff) xpEarned += row.xp_earned || 0;
        });
        data.push({ id: u.id, fullname: u.fullname, profile_picture: u.profile_picture, xp_earned: xpEarned });
      }
      data.sort((a, b) => b.xp_earned - a.xp_earned);
      return res.json(data.slice(0, lim));
    }

    const { data: users } = await supabase.from('users').select('id, fullname, profile_picture, total_xp, level').order('total_xp', { ascending: false }).limit(lim);
    res.json((users || []).map(u => ({ id: u.id, fullname: u.fullname, profile_picture: u.profile_picture, total_xp: u.total_xp || 0, level: u.level || 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserRanking = async (req, res) => {
  try {
    const { data: allUsers } = await supabase.from('users').select('id, total_xp').order('total_xp', { ascending: false });
    const rank = (allUsers || []).findIndex(u => u.id === req.user.id) + 1;
    const user = (allUsers || []).find(u => u.id === req.user.id);
    res.json({ rank, total: allUsers?.length || 0, total_xp: user?.total_xp || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLevelInfo = async (req, res) => {
  try {
    const { data: levels } = await supabase.from('levels').select('*').order('min_xp', { ascending: true });

    const { data: userData } = await supabase.from('users').select('total_xp, level').eq('id', req.user.id).single();
    const totalXp = userData?.total_xp || 0;

    const currentLevel = (levels || []).find(l => totalXp >= l.min_xp && totalXp <= l.max_xp) || (levels || [])[0];
    const currentIdx = (levels || []).indexOf(currentLevel);
    const nextLevel = (levels || [])[currentIdx + 1];

    res.json({
      currentXp: totalXp,
      currentLevel: currentLevel?.level_name || 'Beginner',
      currentLevelNum: userData?.level || 1,
      minXp: currentLevel?.min_xp || 0,
      maxXp: currentLevel?.max_xp || 99,
      nextLevelName: nextLevel?.level_name || 'Max level',
      nextLevelXp: nextLevel?.min_xp || currentLevel?.max_xp || 99,
      progress: nextLevel ? ((totalXp - currentLevel.min_xp) / (nextLevel.min_xp - currentLevel.min_xp)) * 100 : 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getXpHistory = async (req, res) => {
  try {
    const { data: logs } = await supabase.from('xp_log').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
    res.json(logs || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkLevelUp = async (req, res) => {
  try {
    const { data: userData } = await supabase.from('users').select('total_xp, level').eq('id', req.user.id).single();
    const totalXp = userData?.total_xp || 0;

    const { data: levels } = await supabase.from('levels').select('*').order('min_xp', { ascending: true });

    let newLevel = 1;
    (levels || []).forEach((l, i) => { if (totalXp >= l.min_xp) newLevel = i + 1; });

    if (newLevel > (userData?.level || 1)) {
      await supabase.from('users').update({ level: newLevel, updated_at: new Date().toISOString() }).eq('id', req.user.id);
      return res.json({ leveledUp: true, newLevel, levelName: (levels || [])[newLevel - 1]?.level_name });
    }
    res.json({ leveledUp: false, currentLevel: userData?.level || 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLeaderboard, getUserRanking, getLevelInfo, getXpHistory, checkLevelUp };
