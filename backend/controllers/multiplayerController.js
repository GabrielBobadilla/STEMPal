const supabase = require('../config/supabase');
const crypto = require('crypto');

const generateRoomCode = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);

const createRoom = async (req, res) => {
  try {
    const { category, difficulty, max_players } = req.body;
    const roomCode = generateRoomCode();

    const { data: room } = await supabase.from('multiplayer_rooms').insert({
      room_code: roomCode, host_id: req.user.id,
      category: category || 'General', difficulty: difficulty || 'medium',
      max_players: max_players || 4, status: 'waiting',
      created_at: new Date().toISOString()
    }).select('id').single();

    await supabase.from('multiplayer_participants').insert({
      room_id: room.id, user_id: req.user.id, score: 0,
      correct_answers: 0, total_answers: 0,
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      room_id: room.id, room_code: roomCode,
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
    const { data: room } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('room_code', room_code)
      .limit(1)
      .maybeSingle();

    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Game already started.' });

    const { data: parts } = await supabase
      .from('multiplayer_participants')
      .select('*')
      .eq('room_id', room.id);

    if ((parts?.length || 0) >= room.max_players) return res.status(400).json({ message: 'Room is full.' });

    const existing = (parts || []).find(p => p.user_id === req.user.id);
    if (!existing) {
      await supabase.from('multiplayer_participants').insert({
        room_id: room.id, user_id: req.user.id, score: 0,
        correct_answers: 0, total_answers: 0,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      room_id: room.id, room_code,
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
    const { data: room } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('room_code', room_code)
      .limit(1)
      .maybeSingle();

    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const { data: parts } = await supabase
      .from('multiplayer_participants')
      .select('*')
      .eq('room_id', room.id)
      .order('score', { ascending: false });

    const participants = [];
    for (const p of (parts || [])) {
      let fullname = 'Unknown', profile_picture = null;
      try {
        const { data: u } = await supabase.from('users').select('fullname, profile_picture').eq('id', p.user_id).maybeSingle();
        if (u) { fullname = u.fullname; profile_picture = u.profile_picture; }
      } catch (e) {}
      participants.push({ id: p.id, user_id: p.user_id, score: p.score, correct_answers: p.correct_answers, total_answers: p.total_answers, fullname, profile_picture });
    }

    res.json({ id: room.id, room_code: room.room_code, host_id: room.host_id, category: room.category, difficulty: room.difficulty, status: room.status, max_players: room.max_players, created_at: room.created_at, participants });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('multiplayer_quiz_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    const history = [];
    for (const row of (rows || [])) {
      let fullname = 'Unknown';
      try {
        const { data: u } = await supabase.from('users').select('fullname').eq('id', row.user_id).maybeSingle();
        if (u) fullname = u.fullname;
      } catch (e) {}
      history.push({ ...row, fullname });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const saveQuizResult = async (req, res) => {
  try {
    const { room_code, category, difficulty, score, correct_answers, total_questions, rank, total_players } = req.body;

    await supabase.from('multiplayer_quiz_history').insert({
      user_id: req.user.id, room_code, category, difficulty, score,
      correct_answers, total_questions, rank, total_players,
      completed_at: new Date().toISOString()
    });

    const xpEarned = Math.round(score * 2);
    await supabase.from('xp_log').insert({ user_id: req.user.id, xp_earned: xpEarned, reason: `Multiplayer Quiz: ${category}`, created_at: new Date().toISOString() });

    const { data: u } = await supabase.from('users').select('total_xp').eq('id', req.user.id).single();
    await supabase.from('users').update({ total_xp: (u?.total_xp || 0) + xpEarned, updated_at: new Date().toISOString() }).eq('id', req.user.id);

    res.json({ message: 'Result saved.', xp_earned: xpEarned });
  } catch (error) {
    console.error('Save multiplayer result error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createRoom, joinRoom, getRoomInfo, getQuizHistory, saveQuizResult };
