const db = require('../config/db');

const getLeaderboard = async (req, res) => {
  try {
    const { period, limit = 20 } = req.query;
    const lim = parseInt(limit);

    if (period === 'weekly' || period === 'monthly') {
      const days = period === 'weekly' ? 7 : 30;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0,0,0,0);
      const usersSnap = await db.collection('users').get();
      const data = [];
      for (const uDoc of usersSnap.docs) {
        const uData = uDoc.data();
        const xpSnap = await db.collection('xp_log').where('user_id', '==', uDoc.id).get();
        let xpEarned = 0;
        xpSnap.docs.forEach(d => {
          const created = d.data().created_at?.toDate?.() || new Date(d.data().created_at || 0);
          if (created >= cutoff) xpEarned += d.data().xp_earned || 0;
        });
        data.push({ id: uDoc.id, fullname: uData.fullname, profile_picture: uData.profile_picture, xp_earned: xpEarned });
      }
      data.sort((a, b) => b.xp_earned - a.xp_earned);
      return res.json(data.slice(0, lim));
    }

    const snap = await db.collection('users').orderBy('total_xp', 'desc').limit(lim).get();
    res.json(snap.docs.map(d => ({ id: d.id, fullname: d.data().fullname, profile_picture: d.data().profile_picture, total_xp: d.data().total_xp || 0, level: d.data().level || 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUserRanking = async (req, res) => {
  try {
    const snap = await db.collection('users').orderBy('total_xp', 'desc').get();
    const allUsers = snap.docs.map(d => ({ id: d.id, total_xp: d.data().total_xp || 0 }));
    const rank = allUsers.findIndex(u => u.id === req.user.id) + 1;
    const user = allUsers.find(u => u.id === req.user.id);
    res.json({ rank, total: allUsers.length, total_xp: user?.total_xp || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLevelInfo = async (req, res) => {
  try {
    const levelsSnap = await db.collection('levels').orderBy('min_xp', 'asc').get();
    const levels = levelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data() || {};
    const totalXp = userData.total_xp || 0;

    const currentLevel = levels.find(l => totalXp >= l.min_xp && totalXp <= l.max_xp) || levels[0];
    const currentIdx = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIdx + 1];

    res.json({
      currentXp: totalXp,
      currentLevel: currentLevel?.level_name || 'Beginner',
      currentLevelNum: userData.level || 1,
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
    const snap = await db.collection('xp_log').where('user_id', '==', req.user.id).orderBy('created_at', 'desc').limit(50).get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkLevelUp = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    const totalXp = userData.total_xp || 0;

    const levelsSnap = await db.collection('levels').orderBy('min_xp', 'asc').get();
    const levels = levelsSnap.docs.map(d => d.data());

    let newLevel = 1;
    levels.forEach((l, i) => { if (totalXp >= l.min_xp) newLevel = i + 1; });

    if (newLevel > (userData.level || 1)) {
      await db.collection('users').doc(req.user.id).update({ level: newLevel, updated_at: new Date().toISOString() });
      return res.json({ leveledUp: true, newLevel, levelName: levels[newLevel - 1]?.level_name });
    }
    res.json({ leveledUp: false, currentLevel: userData.level || 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLeaderboard, getUserRanking, getLevelInfo, getXpHistory, checkLevelUp };
