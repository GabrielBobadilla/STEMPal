import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { FiUsers, FiPlus, FiLogIn, FiCopy, FiPlay, FiAward, FiClock, FiZap, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { multiplayerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const categories = ['General', 'Science', 'Technology', 'Mathematics'];
const difficulties = ['easy', 'medium', 'hard'];

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);

const Multiplayer = () => {
  const { user } = useAuth();
  const [view, setView] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState('General');
  const [difficulty, setDifficulty] = useState('medium');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [players, setPlayers] = useState([]);
  const [quizState, setQuizState] = useState('waiting');
  const [countdown, setCountdown] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);

  const socketRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const fetchHistory = async () => {
    try { const res = await multiplayerAPI.getHistory(); setHistory(res.data || []); } catch {}
  };

  const connectSocket = useCallback((code) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('join-room', { roomCode: code, user: { id: user.id, fullname: user.fullname } });
    socket.on('room-update', (data) => { setPlayers(data.players); setQuizState(data.quizState); });
    socket.on('countdown', (data) => { setCountdown(data.countdown); setQuizState('starting'); });
    socket.on('question', (data) => { setCurrentQuestion(data); setQuestionIndex(data.questionIndex); setTotalQuestions(data.total); setSelectedAnswer(null); setCorrectAnswerIdx(null); setTimeLeft(data.timeLeft); setQuizState('active'); });
    socket.on('timer', (data) => { setTimeLeft(data.timeLeft); });
    socket.on('time-up', (data) => { setSelectedAnswer(-1); setCorrectAnswerIdx(data.correctAnswer); });
    socket.on('answer-result', (data) => { setCorrectAnswerIdx(data.correctAnswer); });
    socket.on('score-update', (data) => {
      setPlayers(data.players);
      const me = data.players.find(p => p.userId === user.id);
      if (me) { setMyScore(me.score); setMyCorrect(me.correctAnswers); }
    });
    socket.on('game-ended', (data) => {
      setLeaderboard(data.leaderboard);
      setGameEnded(true);
      setQuizState('finished');
      const myRank = data.leaderboard.find(p => p.userId === user.id) || { rank: data.leaderboard.length, score: 0, correctAnswers: 0 };
      multiplayerAPI.saveResult({ room_code: code, category, difficulty, score: myRank.score, correct_answers: myRank.correctAnswers, total_questions: totalQuestions, rank: myRank.rank, total_players: data.leaderboard.length }).catch(() => {});
      toast.info('Quiz finished! Check the leaderboard.');
    });
    socket.on('player-disconnected', (data) => { toast.warning(`${data.fullname} disconnected`); });
  }, [user, category, difficulty, totalQuestions]);

  const handleCreateRoom = async () => {
    setWaiting(true);
    try {
      const res = await multiplayerAPI.createRoom({ category, difficulty, max_players: maxPlayers });
      const code = res.data.room_code;
      setRoomCode(code);
      connectSocket(code);
      setView('game');
      toast.success(`Room created! Code: ${code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally { setWaiting(false); }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return toast.error('Enter a room code');
    setWaiting(true);
    try {
      await multiplayerAPI.joinRoom({ room_code: joinCode.toUpperCase() });
      const code = joinCode.toUpperCase();
      setRoomCode(code);
      connectSocket(code);
      setView('game');
      toast.success('Joined room!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room');
    } finally { setWaiting(false); }
  };

  const handleStartGame = () => { if (socketRef.current) socketRef.current.emit('start-game', { roomCode, category, difficulty }); };

  const handleAnswer = (idx) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(idx);
    if (socketRef.current) socketRef.current.emit('submit-answer', { roomCode, questionIndex: currentQuestion.questionIndex, answer: idx });
  };

  const handleCopyCode = () => { navigator.clipboard.writeText(roomCode); toast.success('Room code copied!'); };

  const handleLeave = () => {
    if (socketRef.current) socketRef.current.disconnect();
    setView('lobby'); setQuizState('waiting'); setGameEnded(false); setCurrentQuestion(null);
    setLeaderboard([]); setPlayers([]); setRoomCode('');
  };

  const isHost = players[0]?.userId === user.id;

  if (view === 'lobby') {
    return (
      <div className="max-w-2xl mx-auto space-y-5 p-4">
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold gradient-text mb-2">Multiplayer Quiz</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Compete with friends in real-time STEM quizzes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiPlus className="w-5 h-5 text-primary-500" /> Create Room</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {categories.map(c => (
                      <button key={c} onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${category === c ? 'gradient-bg text-white' : 'glass text-[var(--text-secondary)]'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Difficulty</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {difficulties.map(d => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${difficulty === d ? 'gradient-bg text-white' : 'glass text-[var(--text-secondary)]'}`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Max Players</label>
                  <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="input-field mt-1 text-sm">
                    {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n} players</option>)}
                  </select>
                </div>
                <button onClick={handleCreateRoom} disabled={waiting}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  <FiPlay className="w-4 h-4" /> {waiting ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiLogIn className="w-5 h-5 text-primary-500" /> Join Room</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Room Code</label>
                  <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter 6-digit code" maxLength={6}
                    className="input-field mt-1 text-center text-lg font-bold tracking-[0.3em]" />
                </div>
                <button onClick={handleJoinRoom} disabled={waiting}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  <FiLogIn className="w-4 h-4" /> {waiting ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 sm:p-6">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-lg font-semibold">History</h2>
            <span className="text-xs text-[var(--text-secondary)]">{showHistory ? <FiChevronUp /> : <FiChevronDown />}</span>
          </button>
          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No games played yet</p>
              ) : history.map((h, i) => (
                <div key={h._id || h.id || i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
                  <div>
                    <span className="font-medium">{h.category}</span>
                    <span className={`ml-2 text-xs badge-${h.difficulty === 'easy' ? 'success' : h.difficulty === 'medium' ? 'warning' : 'danger'}`}>{h.difficulty}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-500">{h.score} pts</div>
                    <div className="text-xs text-[var(--text-secondary)]">Rank #{h.rank}/{h.total_players}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 p-4">
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold gradient-text">Multiplayer Quiz</h1>
            <p className="text-xs text-[var(--text-secondary)]">Room: <span className="font-mono font-bold tracking-wider text-primary-500">{roomCode}</span>
              <button onClick={handleCopyCode} className="ml-1 text-primary-500 hover:text-primary-400"><FiCopy className="w-3 h-3 inline" /></button>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isHost && quizState === 'waiting' && players.length >= 2 && (
              <button onClick={handleStartGame} className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><FiPlay className="w-4 h-4" /> Start Game</button>
            )}
            <button onClick={handleLeave} className="btn-secondary text-sm px-3 py-2">Leave</button>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><FiUsers className="w-4 h-4 text-primary-500" /> Players ({players.length})</h2>
        <div className="flex flex-wrap gap-3">
          {players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${i === 0 ? 'gradient-bg text-white' : 'bg-[var(--bg-secondary)]'}`}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {i === 0 ? '\u{1F451}' : p.fullname.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium">{p.fullname}</span>
              {p.userId === user.id && <span className="text-xs opacity-70">(You)</span>}
              <span className="text-xs font-bold ml-1">{p.score}pts</span>
            </div>
          ))}
        </div>
      </div>

      {quizState === 'starting' && countdown > 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl font-bold gradient-text mb-2">{countdown}</div>
          <p className="text-[var(--text-secondary)]">Get ready!</p>
        </div>
      )}

      {quizState === 'waiting' && players.length < 2 && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">{'\u23F3'}</div>
          <p className="text-[var(--text-secondary)]">Waiting for players to join...</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Share room code: <span className="font-mono font-bold text-primary-500 text-lg">{roomCode}</span></p>
        </div>
      )}

      {currentQuestion && quizState === 'active' && (
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--text-secondary)]">Question {questionIndex + 1}/{totalQuestions}</span>
            <div className="flex items-center gap-2">
              <FiClock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-primary-500'}`} />
              <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-primary-500'}`}>{timeLeft}s</span>
            </div>
          </div>
          <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-6">
            <div className="gradient-bg h-2 rounded-full transition-all duration-300" style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
          <h3 className="text-lg font-semibold mb-6">{currentQuestion.question}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              let cls = 'border-[var(--glass-border)] hover:border-primary-300';
              if (selectedAnswer !== null) {
                if (idx === correctAnswerIdx) cls = 'border-green-500 bg-green-500/10 text-green-400';
                else if (selectedAnswer === idx) cls = 'border-red-500 bg-red-500/10 text-red-400';
                else cls = 'opacity-40';
              } else if (selectedAnswer === idx) {
                cls = 'border-primary-500 bg-primary-500/10';
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedAnswer !== null}
                  className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${cls}`}>
                  <span className="text-xs text-[var(--text-secondary)] block mb-1">{String.fromCharCode(65 + idx)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {quizState === 'active' && players.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><FiZap className="w-4 h-4 text-primary-500" /> Live Scores</h3>
          <div className="space-y-1">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${p.userId === user.id ? 'bg-primary-500/10' : ''}`}>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] w-4">{i + 1}.</span>
                  <span className="font-medium">{p.fullname}</span>
                  {p.userId === user.id && <span className="text-xs text-primary-500">(You)</span>}
                </span>
                <span className="font-bold text-primary-500">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quizState === 'finished' && gameEnded && (
        <div className="glass-card p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{'\uD83C\uDFC6'}</div>
            <h2 className="text-xl font-bold gradient-text">Game Over!</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {leaderboard[0]?.userId === user.id ? 'Congratulations, you won!' : `Winner: ${leaderboard[0]?.fullname || 'N/A'}`}
            </p>
          </div>
          <div className="space-y-2">
            {leaderboard.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'gradient-bg text-white' : i < 3 ? 'bg-primary-500/10' : 'bg-[var(--bg-secondary)]'}`}>
                <span className="flex items-center gap-3">
                  <span className="text-lg">{i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}</span>
                  <span className="font-medium">{p.fullname}</span>
                  {p.userId === user.id && <span className="text-xs opacity-70">(You)</span>}
                </span>
                <div className="text-right">
                  <div className="font-bold">{p.score} pts</div>
                  <div className="text-xs opacity-70">{p.correctAnswers}/{p.totalAnswers} correct</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleLeave} className="btn-primary mt-6 w-full flex items-center justify-center gap-2 text-sm">
            <FiAward className="w-4 h-4" /> Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default Multiplayer;
