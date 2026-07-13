const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const checkAchievements = (streak) => {
  const badges = [];
  if (streak >= 3) badges.push({ name: 'Bronze Badge', type: 'bronze', description: '3-day study streak' });
  if (streak >= 7) badges.push({ name: 'Silver Badge', type: 'silver', description: '7-day study streak' });
  if (streak >= 14) badges.push({ name: 'Gold Badge', type: 'gold', description: '14-day study streak' });
  if (streak >= 30) badges.push({ name: 'Platinum Badge', type: 'platinum', description: '30-day study streak' });
  if (streak >= 100) badges.push({ name: 'STEM Master Badge', type: 'master', description: '100-day study streak' });
  return badges;
};

const updateStreak = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const snap = await db.collection('streaks').where('user_id', '==', req.user.id).limit(1).get();

    if (snap.empty) {
      await db.collection('streaks').add({
        user_id: req.user.id, current_streak: 1, longest_streak: 1, last_active_date: today
      });
      return res.json({ current_streak: 1, longest_streak: 1, message: 'Streak started!' });
    }

    const streakDoc = snap.docs[0];
    const streak = streakDoc.data();
    const lastDate = streak.last_active_date || null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === today) {
      return res.json({ current_streak: streak.current_streak, longest_streak: streak.longest_streak, message: 'Already active today.' });
    }

    let newStreak = lastDate === yesterday ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    await streakDoc.ref.update({ current_streak: newStreak, longest_streak: newLongest, last_active_date: today });

    const achievements = checkAchievements(newStreak);
    for (const badge of achievements) {
      const existing = await db.collection('achievements')
        .where('user_id', '==', req.user.id).where('badge_name', '==', badge.name).limit(1).get();
      if (existing.empty) {
        await db.collection('achievements').add({
          user_id: req.user.id, badge_name: badge.name, badge_type: badge.type,
          description: badge.description, unlocked_date: new Date().toISOString(),
          created_at: FieldValue.serverTimestamp()
        });
      }
    }

    if (newStreak >= 3) {
      const xpBonus = newStreak * 2;
      await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: xpBonus, reason: `Streak bonus: ${newStreak} days`, created_at: FieldValue.serverTimestamp() });
      await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(xpBonus), updated_at: FieldValue.serverTimestamp() });
    }

    res.json({ current_streak: newStreak, longest_streak: newLongest, achievements, message: 'Streak updated!' });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStreak = async (req, res) => {
  try {
    const snap = await db.collection('streaks').where('user_id', '==', req.user.id).limit(1).get();
    if (snap.empty) return res.json({ current_streak: 0, longest_streak: 0 });
    res.json(snap.docs[0].data());
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { updateStreak, getStreak };
