const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const getAchievements = async (req, res) => {
  try {
    const snap = await db.collection('achievements')
      .where('user_id', '==', req.user.id)
      .orderBy('unlocked_date', 'desc').get();
    const achievements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkAndAward = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizSnap = await db.collection('quizzes').where('user_id', '==', userId).get();
    const quizCount = quizSnap.size;
    let avgScore = 0;
    if (quizCount > 0) {
      avgScore = quizSnap.docs.reduce((s, d) => s + (d.data().score || 0), 0) / quizCount;
    }

    const streakSnap = await db.collection('streaks').where('user_id', '==', userId).limit(1).get();
    const streak = !streakSnap.empty ? (streakSnap.docs[0].data().current_streak || 0) : 0;

    const userDoc = await db.collection('users').doc(userId).get();
    const totalXp = userDoc.data()?.total_xp || 0;

    const newBadges = [];

    if (quizCount >= 10) {
      const exists = await db.collection('achievements').where('user_id', '==', userId).where('badge_name', '==', 'Quiz Master').limit(1).get();
      if (exists.empty) {
        await db.collection('achievements').add({
          user_id: userId, badge_name: 'Quiz Master', badge_type: 'gold',
          description: 'Completed 10 quizzes', unlocked_date: new Date().toISOString(),
          created_at: FieldValue.serverTimestamp()
        });
        newBadges.push({ name: 'Quiz Master', type: 'gold' });
      }
    }

    if (totalXp >= 1000) {
      const exists = await db.collection('achievements').where('user_id', '==', userId).where('badge_name', '==', 'XP Champion').limit(1).get();
      if (exists.empty) {
        await db.collection('achievements').add({
          user_id: userId, badge_name: 'XP Champion', badge_type: 'platinum',
          description: 'Earned 1000 XP', unlocked_date: new Date().toISOString(),
          created_at: FieldValue.serverTimestamp()
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
