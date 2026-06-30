const pool = require('../config/db');
const crypto = require('crypto');

const generateRoomCode = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);

const createRoom = async (req, res) => {
  try {
    const { category, difficulty, max_players } = req.body;
    const roomCode = generateRoomCode();

    const [result] = await pool.query(
      'INSERT INTO multiplayer_rooms (room_code, host_id, category, difficulty, max_players) VALUES (?, ?, ?, ?, ?)',
      [roomCode, req.user.id, category || 'General', difficulty || 'medium', max_players || 4]
    );

    await pool.query(
      'INSERT INTO multiplayer_participants (room_id, user_id) VALUES (?, ?)',
      [result.insertId, req.user.id]
    );

    res.status(201).json({
      room_id: result.insertId,
      room_code: roomCode,
      category: category || 'General',
      difficulty: difficulty || 'medium',
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
    const [rooms] = await pool.query(
      'SELECT id, status, host_id, max_players, category, difficulty FROM multiplayer_rooms WHERE room_code = ?',
      [room_code]
    );
    if (rooms.length === 0) return res.status(404).json({ message: 'Room not found.' });

    const room = rooms[0];
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Game already started.' });

    const [participants] = await pool.query(
      'SELECT COUNT(*) as count FROM multiplayer_participants WHERE room_id = ?',
      [room.id]
    );
    if (participants[0].count >= room.max_players) return res.status(400).json({ message: 'Room is full.' });

    const [existing] = await pool.query(
      'SELECT id FROM multiplayer_participants WHERE room_id = ? AND user_id = ?',
      [room.id, req.user.id]
    );
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO multiplayer_participants (room_id, user_id) VALUES (?, ?)',
        [room.id, req.user.id]
      );
    }

    res.json({
      room_id: room.id,
      room_code,
      category: room.category,
      difficulty: room.difficulty,
      host_id: room.host_id,
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getRoomInfo = async (req, res) => {
  try {
    const { room_code } = req.params;
    const [rooms] = await pool.query(
      'SELECT id, room_code, host_id, category, difficulty, status, max_players, created_at FROM multiplayer_rooms WHERE room_code = ?',
      [room_code]
    );
    if (rooms.length === 0) return res.status(404).json({ message: 'Room not found.' });

    const [participants] = await pool.query(
      `SELECT mp.id, mp.user_id, mp.score, mp.correct_answers, mp.total_answers, u.fullname, u.profile_picture
       FROM multiplayer_participants mp JOIN users u ON mp.user_id = u.id WHERE mp.room_id = ? ORDER BY mp.score DESC`,
      [rooms[0].id]
    );

    res.json({ ...rooms[0], participants });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const [history] = await pool.query(
      `SELECT mqh.*, u.fullname FROM multiplayer_quiz_history mqh
       JOIN users u ON mqh.user_id = u.id
       WHERE mqh.user_id = ? ORDER BY mqh.completed_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveQuizResult = async (req, res) => {
  try {
    const { room_code, category, difficulty, score, correct_answers, total_questions, rank, total_players } = req.body;
    await pool.query(
      `INSERT INTO multiplayer_quiz_history (user_id, room_code, category, difficulty, score, correct_answers, total_questions, rank, total_players) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, room_code, category, difficulty, score, correct_answers, total_questions, rank, total_players]
    );

    const xpEarned = Math.round(score * 2);
    await pool.query('INSERT INTO xp_log (user_id, xp_earned, reason) VALUES (?, ?, ?)', [req.user.id, xpEarned, `Multiplayer Quiz: ${category}`]);
    await pool.query('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpEarned, req.user.id]);

    res.json({ message: 'Result saved.', xp_earned: xpEarned });
  } catch (error) {
    console.error('Save multiplayer result error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createRoom, joinRoom, getRoomInfo, getQuizHistory, saveQuizResult };