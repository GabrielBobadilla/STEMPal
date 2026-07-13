const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;
const crypto = require('crypto');

const generateRoomCode = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);

const createRoom = async (req, res) => {
  try {
    const { category, difficulty, max_players } = req.body;
    const roomCode = generateRoomCode();

    const ref = await db.collection('multiplayer_rooms').add({
      room_code: roomCode, host_id: req.user.id,
      category: category || 'General', difficulty: difficulty || 'medium',
      max_players: max_players || 4, status: 'waiting',
      created_at: FieldValue.serverTimestamp()
    });

    await db.collection('multiplayer_participants').add({
      room_id: ref.id, user_id: req.user.id, score: 0,
      correct_answers: 0, total_answers: 0,
      created_at: FieldValue.serverTimestamp()
    });

    res.status(201).json({
      room_id: ref.id, room_code: roomCode,
      category: category || 'General', difficulty: difficulty || 'medium',
      max_players: max_players || 4,
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { room_code } = req.body;
    const roomSnap = await db.collection('multiplayer_rooms').where('room_code', '==', room_code).limit(1).get();
    if (roomSnap.empty) return res.status(404).json({ message: 'Room not found.' });

    const roomDoc = roomSnap.docs[0];
    const room = roomDoc.data();
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Game already started.' });

    const partSnap = await db.collection('multiplayer_participants').where('room_id', '==', roomDoc.id).get();
    if (partSnap.size >= room.max_players) return res.status(400).json({ message: 'Room is full.' });

    const existing = partSnap.docs.find(d => d.data().user_id === req.user.id);
    if (!existing) {
      await db.collection('multiplayer_participants').add({
        room_id: roomDoc.id, user_id: req.user.id, score: 0,
        correct_answers: 0, total_answers: 0,
        created_at: FieldValue.serverTimestamp()
      });
    }

    res.json({
      room_id: roomDoc.id, room_code,
      category: room.category, difficulty: room.difficulty, host_id: room.host_id,
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getRoomInfo = async (req, res) => {
  try {
    const { room_code } = req.params;
    const roomSnap = await db.collection('multiplayer_rooms').where('room_code', '==', room_code).limit(1).get();
    if (roomSnap.empty) return res.status(404).json({ message: 'Room not found.' });

    const roomDoc = roomSnap.docs[0];
    const roomData = roomDoc.data();

    const partSnap = await db.collection('multiplayer_participants').where('room_id', '==', roomDoc.id).orderBy('score', 'desc').get();
    const participants = [];
    for (const pDoc of partSnap.docs) {
      const pData = pDoc.data();
      let fullname = 'Unknown', profile_picture = null;
      try { const uDoc = await db.collection('users').doc(pData.user_id).get(); if (uDoc.exists) { fullname = uDoc.data().fullname; profile_picture = uDoc.data().profile_picture; } } catch (e) {}
      participants.push({ id: pDoc.id, user_id: pData.user_id, score: pData.score, correct_answers: pData.correct_answers, total_answers: pData.total_answers, fullname, profile_picture });
    }

    res.json({ id: roomDoc.id, room_code: roomData.room_code, host_id: roomData.host_id, category: roomData.category, difficulty: roomData.difficulty, status: roomData.status, max_players: roomData.max_players, created_at: roomData.created_at, participants });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const snap = await db.collection('multiplayer_quiz_history')
      .where('user_id', '==', req.user.id)
      .orderBy('completed_at', 'desc').limit(20).get();
    const history = [];
    for (const d of snap.docs) {
      const data = d.data();
      let fullname = 'Unknown';
      try { const uDoc = await db.collection('users').doc(data.user_id).get(); if (uDoc.exists) fullname = uDoc.data().fullname; } catch (e) {}
      history.push({ id: d.id, ...data, fullname });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveQuizResult = async (req, res) => {
  try {
    const { room_code, category, difficulty, score, correct_answers, total_questions, rank, total_players } = req.body;

    await db.collection('multiplayer_quiz_history').add({
      user_id: req.user.id, room_code, category, difficulty, score,
      correct_answers, total_questions, rank, total_players,
      completed_at: FieldValue.serverTimestamp()
    });

    const xpEarned = Math.round(score * 2);
    await db.collection('xp_log').add({ user_id: req.user.id, xp_earned: xpEarned, reason: `Multiplayer Quiz: ${category}`, created_at: FieldValue.serverTimestamp() });
    await db.collection('users').doc(req.user.id).update({ total_xp: FieldValue.increment(xpEarned), updated_at: FieldValue.serverTimestamp() });

    res.json({ message: 'Result saved.', xp_earned: xpEarned });
  } catch (error) {
    console.error('Save multiplayer result error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createRoom, joinRoom, getRoomInfo, getQuizHistory, saveQuizResult };
