const supabase = require('../config/supabase');

const getAchievements = async (req, res) => {
  try {
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', req.user.id)
      .order('unlocked_date', { ascending: false });
    res.json(achievements || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkAndAward = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('score')
      .eq('user_id', userId);
    const quizCount = quizzes?.length || 0;
    let avgScore = 0;
    if (quizCount > 0) {
      avgScore = quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizCount;
    }

    const { data: streakRows } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .limit(1);
    const streak = streakRows && streakRows.length > 0 ? (streakRows[0].current_streak || 0) : 0;

    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();
    const totalXp = user?.total_xp || 0;

    const newBadges = [];

    if (quizCount >= 10) {
      const { data: exists } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_name', 'Quiz Master')
        .limit(1);
      if (!exists || exists.length === 0) {
        await supabase.from('achievements').insert({
          user_id: userId, badge_name: 'Quiz Master', badge_type: 'gold',
          description: 'Completed 10 quizzes', unlocked_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        newBadges.push({ name: 'Quiz Master', type: 'gold' });
      }
    }

    if (totalXp >= 1000) {
      const { data: exists } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_name', 'XP Champion')
        .limit(1);
      if (!exists || exists.length === 0) {
        await supabase.from('achievements').insert({
          user_id: userId, badge_name: 'XP Champion', badge_type: 'platinum',
          description: 'Earned 1000 XP', unlocked_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        newBadges.push({ name: 'XP Champion', type: 'platinum' });
      }
    }

    res.json({ newBadges, total: newBadges.length > 0 ? 'New achievements unlocked!' : 'No new achievements.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAchievements, checkAndAward };
