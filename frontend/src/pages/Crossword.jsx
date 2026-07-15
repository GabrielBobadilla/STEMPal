import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  FiGrid, FiClock, FiStar, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiZap, FiUsers, FiAward, FiArrowRight, FiCopy, FiCheck, FiEye,
  FiArrowLeft, FiSettings, FiTrendingUp, FiTarget
} from 'react-icons/fi';
import CrosswordGrid from '../components/crossword/CrosswordGrid';
import CrosswordClues from '../components/crossword/CrosswordClues';
import { crosswordAPI, quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);

const STEM_TOPICS = [
  'Cell Biology', 'Genetics', 'Ecology', 'Human Anatomy',
  'Chemical Bonding', 'Organic Chemistry', 'Periodic Table',
  'Newtonian Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics',
  'Algebra', 'Calus', 'Trigonometry', 'Statistics',
  'Programming', 'Data Structures', 'Algorithms', 'Networking',
];

const difficulties = [
  { id: 'easy', label: 'Easy', words: '8-12', color: 'emerald', icon: '🌱' },
  { id: 'medium', label: 'Medium', words: '12-18', color: 'amber', icon: '⚡' },
  { id: 'hard', label: 'Hard', words: '15-25', color: 'red', icon: '🔥' },
];

const badges = [
  { name: 'Crossword Master', desc: 'Complete 10 crosswords', icon: '🏆' },
  { name: 'STEM Solver', desc: 'Complete 5 STEM crosswords', icon: '🧬' },
  { name: 'Speed Demon', desc: 'Complete in under 2 minutes', icon: '⚡' },
  { name: 'No Hints', desc: 'Complete without any hints', icon: '🧠' },
];

const Crossword = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('solo');
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState(5);
  const [completedWords, setCompletedWords] = useState(new Set());
  const [revealedCells, setRevealedCells] = useState(new Set());
  const [totalWords, setTotalWords] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeClue, setActiveClue] = useState(null);
  const [cellHighlights, setCellHighlights] = useState({});
  const [activeCell, setActiveCell] = useState(null);
  const [direction, setDirection] = useState('across');
  const [stats, setStats] = useState(null);
  const [showBadges, setShowBadges] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLimit, setTimeLimit] = useState(600);
  const [questionCount, setQuestionCount] = useState(15);
  const [personalized, setPersonalized] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [checkMode, setCheckMode] = useState(false);
  const [wrongCells, setWrongCells] = useState(new Set());
  const [showProgress, setShowProgress] = useState(false);

  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const gridRef = useRef(null);

  // Multiplayer state
  const [mpView, setMpView] = useState('lobby');
  const [mpRoomCode, setMpRoomCode] = useState('');
  const [mpJoinCode, setMpJoinCode] = useState('');
  const [mpPlayers, setMpPlayers] = useState([]);
  const [mpState, setMpState] = useState('waiting');
  const [mpPuzzle, setMpPuzzle] = useState(null);
  const [mpTimeLeft, setMpTimeLeft] = useState(600);
  const [mpLeaderboard, setMpLeaderboard] = useState([]);
  const [mpGameEnded, setMpGameEnded] = useState(false);
  const [mpTopic, setMpTopic] = useState('');
  const [mpDifficulty, setMpDifficulty] = useState('medium');
  const [mpTimeLimit, setMpTimeLimit] = useState(600);
  const [mpCountdown, setMpCountdown] = useState(0);
  const [mpCellHighlights, setMpCellHighlights] = useState({});
  const [mpPlayerProgress, setMpPlayerProgress] = useState({});

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => { fetchHistory(); fetchStats(); return () => { if (socketRef.current) socketRef.current.disconnect(); }; }, []);

  const fetchHistory = async () => {
    try { const res = await crosswordAPI.getHistory(); setHistory(res.data || []); } catch {}
  };

  const fetchStats = async () => {
    try { const res = await crosswordAPI.getStats(); setStats(res.data); } catch {}
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const calculateScore = useCallback(() => {
    const baseScore = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
    const hintPenalty = hintsUsed * (difficulty === 'easy' ? 10 : 20);
    const maxTime = difficulty === 'easy' ? 600 : difficulty === 'medium' ? 900 : 1200;
    const timeBonus = Math.max(0, Math.floor((maxTime - timeElapsed) / 10));
    return Math.max(0, baseScore + timeBonus - hintPenalty);
  }, [difficulty, hintsUsed, timeElapsed]);

  const handleGeneratePuzzle = async (selectedTopic, isAdaptive = false) => {
    if (!selectedTopic && !customTopic) {
      toast.warning('Please select or enter a topic');
      return;
    }
    const useTopic = selectedTopic || customTopic;
    setGenerating(true);
    setLoading(true);
    try {
      const data = {
        topic: useTopic,
        difficulty,
        count: questionCount,
        mode: isAdaptive ? 'adaptive' : 'solo',
      };
      if (isAdaptive) {
        data.weakTopics = await getWeakTopics();
      }
      const res = await crosswordAPI.generate(data);
      setPuzzle(res.data);
      setTotalWords(res.data.totalWords);
      setMaxHints(difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : 3);
      setCompletedWords(new Set());
      setRevealedCells(new Set());
      setTimeElapsed(0);
      setTimerRunning(true);
      setScore(0);
      setHintsUsed(0);
      setPuzzleCompleted(false);
      setWrongCells(new Set());
      setCheckMode(false);
      setActiveClue(null);
      setCellHighlights({});
      toast.success('Crossword generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate crossword. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const getWeakTopics = async () => {
    try {
      const res = await quizAPI.getWeakTopics();
      return (res.data || []).slice(0, 3).map(t => t.topic || t.weak_topic || '');
    } catch { return []; }
  };

  const handleWordCompleted = useCallback((entry) => {
    const key = `${entry.direction}-${entry.number}`;
    setCompletedWords(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setScore(prev => prev + 10);

    if (mode === 'multiplayer' && socketRef.current && mpRoomCode) {
      socketRef.current.emit('crossword-word-completed', {
        roomCode: mpRoomCode,
        wordNumber: entry.number,
        direction: entry.direction,
      });
    }

    if (mode === 'multiplayer' && socketRef.current && mpRoomCode) {
      const newCompleted = new Set(completedWords);
      newCompleted.add(key);
      if (newCompleted.size >= totalWords) {
        socketRef.current.emit('crossword-complete', { roomCode: mpRoomCode });
      }
    }
  }, [mode, mpRoomCode, completedWords, totalWords]);

  const handleCellChange = useCallback((row, col, letter) => {
    if (mode === 'multiplayer' && socketRef.current && mpRoomCode) {
      socketRef.current.emit('crossword-cell-update', { roomCode: mpRoomCode, row, col, letter });
    }
  }, [mode, mpRoomCode]);

  const handleClueClick = useCallback((entry) => {
    setActiveClue(entry);
    setDirection(entry.direction);
    setActiveCell({ row: entry.row, col: entry.col });
  }, []);

  const handleHint = useCallback((entry) => {
    if (hintsUsed >= maxHints) {
      toast.warning('No hints remaining');
      return;
    }

    const wordCells = [];
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.direction === 'across' ? entry.row : entry.row + i;
      const c = entry.direction === 'across' ? entry.col + i : entry.col;
      wordCells.push({ row: r, col: c, letter: entry.answer[i] });
    }

    const unrevealed = wordCells.find(({ row, col }) => !revealedCells.has(`${row}-${col}`));
    if (unrevealed) {
      setRevealedCells(prev => {
        const next = new Set(prev);
        next.add(`${unrevealed.row}-${unrevealed.col}`);
        return next;
      });
      setHintsUsed(h => h + 1);
      setScore(prev => Math.max(0, prev - 5));

      if (mode === 'multiplayer' && socketRef.current && mpRoomCode) {
        socketRef.current.emit('crossword-hint-used', { roomCode: mpRoomCode });
      }
    }
  }, [hintsUsed, maxHints, revealedCells, mode, mpRoomCode]);

  const handleCheckAnswers = useCallback(() => {
    if (!puzzle || !gridRef.current) return;
    setCheckMode(true);
    const gridState = gridRef.current.getGrid();
    if (!gridState) return;
    const wrong = new Set();
    let allCorrect = true;

    for (const entry of puzzle.across || []) {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.row;
        const c = entry.col + i;
        const cell = gridState[r]?.[c];
        const userLetter = (cell?.userLetter || '').toUpperCase();
        const correctLetter = entry.answer[i];
        if (!userLetter || userLetter !== correctLetter) {
          wrong.add(`${r}-${c}`);
          allCorrect = false;
        }
      }
    }

    for (const entry of puzzle.down || []) {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.row + i;
        const c = entry.col;
        const cell = gridState[r]?.[c];
        const userLetter = (cell?.userLetter || '').toUpperCase();
        const correctLetter = entry.answer[i];
        if (!userLetter || userLetter !== correctLetter) {
          wrong.add(`${r}-${c}`);
          allCorrect = false;
        }
      }
    }

    setWrongCells(wrong);
    if (allCorrect) {
      toast.success('All answers are correct!');
    } else {
      toast.info(`Found ${wrong.size} incorrect cell(s).`);
    }
  }, [puzzle]);

  const handleManualComplete = useCallback(async () => {
    handleCheckAnswers();
    setTimerRunning(false);
    setPuzzleCompleted(true);
    const finalScore = calculateScore();
    setScore(finalScore);
    try {
      await crosswordAPI.saveScore({
        puzzle_data: { title: puzzle.title, totalWords, difficulty },
        difficulty,
        score: finalScore,
        total_words: totalWords,
        completed_words: completedWords.size,
        hints_used: hintsUsed,
        time_taken: timeElapsed,
        completed: true,
      });
      toast.success(`Puzzle complete! +${finalScore} XP`);
      fetchHistory();
      fetchStats();
      checkBadges(finalScore);
    } catch { toast.error('Failed to save score'); }
  }, [puzzle, difficulty, totalWords, completedWords, hintsUsed, timeElapsed, calculateScore, handleCheckAnswers]);

  const checkBadges = (finalScore) => {
    const newBadges = [];
    const completedCount = (stats?.completed_count || 0) + 1;
    if (completedCount >= 10) newBadges.push('Crossword Master');
    if (completedCount >= 5) newBadges.push('STEM Solver');
    if (timeElapsed < 120) newBadges.push('Speed Demon');
    if (hintsUsed === 0) newBadges.push('No Hints');
    if (newBadges.length > 0) {
      setEarnedBadges(newBadges);
      setShowBadges(true);
    }
  };

  // Multiplayer socket setup
  const connectMultiplayer = useCallback((code) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('crossword-room-update', (data) => {
      setMpPlayers(data.players);
      setMpState(data.state);
      if (data.puzzle) setMpPuzzle(data.puzzle);
      if (data.topic) setMpTopic(data.topic);
      if (data.difficulty) setMpDifficulty(data.difficulty);
      if (data.timeLeft) setMpTimeLeft(data.timeLeft);
    });

    socket.on('crossword-room-created', (data) => {
      setMpRoomCode(data.roomCode);
    });

    socket.on('crossword-started', (data) => {
      setMpState('active');
      setMpTimeLeft(data.timeLeft);
      setMpCountdown(0);
      setTimerRunning(true);
    });

    socket.on('crossword-timer', (data) => {
      setMpTimeLeft(data.timeLeft);
    });

    socket.on('crossword-progress', (data) => {
      setMpPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: {
          fullname: data.fullname,
          wordsCompleted: data.wordsCompleted,
          score: data.score,
        },
      }));
    });

    socket.on('crossword-cell-changed', (data) => {
      setMpCellHighlights(prev => ({
        ...prev,
        [`${data.row}-${data.col}`]: data.letter,
      }));
    });

    socket.on('crossword-game-ended', (data) => {
      setMpLeaderboard(data.leaderboard);
      setMpGameEnded(true);
      setMpState('finished');
      setTimerRunning(false);
    });

    socket.on('crossword-player-disconnected', (data) => {
      toast.warning(`${data.fullname} disconnected`);
    });

    socket.on('crossword-error', (data) => {
      toast.error(data.message);
    });
  }, []);

  const handleCreateMultiplayerRoom = async () => {
    if (!mpTopic) {
      toast.warning('Please enter a topic');
      return;
    }
    setLoading(true);
    try {
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.emit('create-crossword-room', {
        topic: mpTopic,
        difficulty: mpDifficulty,
        timeLimit: mpTimeLimit,
        user: { id: user.id, fullname: user.fullname },
      });

      socket.on('crossword-room-created', (data) => {
        setMpRoomCode(data.roomCode);
        setMpView('game');
        toast.success(`Room created! Code: ${data.roomCode}`);
      });

      socket.on('crossword-room-update', (data) => {
        setMpPlayers(data.players);
        setMpState(data.state);
        if (data.puzzle) setMpPuzzle(data.puzzle);
      });

      socket.on('crossword-started', (data) => {
        setMpState('active');
        setMpTimeLeft(data.timeLeft);
        setTimerRunning(true);
      });

      socket.on('crossword-timer', (data) => setMpTimeLeft(data.timeLeft));
      socket.on('crossword-progress', (data) => {
        setMpPlayerProgress(prev => ({
          ...prev,
          [data.playerId]: { fullname: data.fullname, wordsCompleted: data.wordsCompleted, score: data.score },
        }));
      });
      socket.on('crossword-cell-changed', (data) => {
        setMpCellHighlights(prev => ({ ...prev, [`${data.row}-${data.col}`]: data.letter }));
      });
      socket.on('crossword-game-ended', (data) => {
        setMpLeaderboard(data.leaderboard);
        setMpGameEnded(true);
        setMpState('finished');
        setTimerRunning(false);
      });
      socket.on('crossword-player-disconnected', (data) => toast.warning(`${data.fullname} disconnected`));
      socket.on('crossword-error', (data) => toast.error(data.message));
    } catch (err) {
      toast.error('Failed to create room');
    } finally { setLoading(false); }
  };

  const handleJoinMultiplayerRoom = () => {
    if (!mpJoinCode.trim()) return toast.error('Enter a room code');
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('join-crossword-room', {
      roomCode: mpJoinCode.toUpperCase(),
      user: { id: user.id, fullname: user.fullname },
    });
    setMpRoomCode(mpJoinCode.toUpperCase());
    setMpView('game');

    socket.on('crossword-room-update', (data) => {
      setMpPlayers(data.players);
      setMpState(data.state);
      if (data.puzzle) setMpPuzzle(data.puzzle);
      if (data.timeLeft) setMpTimeLeft(data.timeLeft);
    });
    socket.on('crossword-started', (data) => {
      setMpState('active');
      setMpTimeLeft(data.timeLeft);
      setTimerRunning(true);
    });
    socket.on('crossword-timer', (data) => setMpTimeLeft(data.timeLeft));
    socket.on('crossword-progress', (data) => {
      setMpPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: { fullname: data.fullname, wordsCompleted: data.wordsCompleted, score: data.score },
      }));
    });
    socket.on('crossword-cell-changed', (data) => {
      setMpCellHighlights(prev => ({ ...prev, [`${data.row}-${data.col}`]: data.letter }));
    });
    socket.on('crossword-game-ended', (data) => {
      setMpLeaderboard(data.leaderboard);
      setMpGameEnded(true);
      setMpState('finished');
      setTimerRunning(false);
    });
    socket.on('crossword-player-disconnected', (data) => toast.warning(`${data.fullname} disconnected`));
    socket.on('crossword-error', (data) => toast.error(data.message));
  };

  const handleStartMultiplayerGame = () => {
    if (socketRef.current) socketRef.current.emit('start-crossword', { roomCode: mpRoomCode });
  };

  const handleCopyCode = () => { navigator.clipboard.writeText(mpRoomCode); toast.success('Room code copied!'); };

  const handleLeaveMultiplayer = () => {
    if (socketRef.current) socketRef.current.disconnect();
    setMpView('lobby');
    setMpRoomCode('');
    setMpPuzzle(null);
    setMpPlayers([]);
    setMpState('waiting');
    setMpGameEnded(false);
    setMpLeaderboard([]);
    setTimerRunning(false);
    setPuzzle(null);
  };

  const isHost = mpPlayers.length > 0 && mpPlayers[0]?.userId === user?.id;

  const progressPercent = totalWords > 0 ? Math.round((completedWords.size / totalWords) * 100) : 0;

  if (mode === 'multiplayer' && mpView === 'lobby') {
    return (
      <div className="max-w-4xl mx-auto space-y-5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Multiplayer Crossword</h1>
            <p className="text-sm text-[var(--text-secondary)]">Compete with friends in real-time crossword puzzles</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode('solo')} className="btn-secondary text-sm px-3 py-1.5">Solo Mode</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm">+</span>
              Create Room
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Topic</label>
                <input
                  value={mpTopic}
                  onChange={(e) => setMpTopic(e.target.value)}
                  placeholder="e.g. Cell Biology, Newtonian Mechanics"
                  className="input-field mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Difficulty</label>
                <div className="flex gap-2 mt-1">
                  {difficulties.map(d => (
                    <button key={d.id} onClick={() => setMpDifficulty(d.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        mpDifficulty === d.id ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)]'
                      }`}>
                      {d.icon} {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Time Limit</label>
                <select value={mpTimeLimit} onChange={e => setMpTimeLimit(Number(e.target.value))}
                  className="input-field mt-1 text-sm">
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={900}>15 minutes</option>
                  <option value={1200}>20 minutes</option>
                </select>
              </div>
              <button onClick={handleCreateMultiplayerRoom} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm"><FiArrowRight /></span>
              Join Room
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Room Code</label>
                <input value={mpJoinCode} onChange={e => setMpJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code" maxLength={6}
                  className="input-field mt-1 text-center text-lg font-bold tracking-widest" />
              </div>
              <button onClick={handleJoinMultiplayerRoom}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                Join Room
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (mode === 'multiplayer' && mpView === 'game') {
    return (
      <div className="max-w-5xl mx-auto space-y-5 p-4">
        <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold gradient-text">Multiplayer Crossword</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Room: <span className="font-mono font-bold tracking-wider text-primary-500">{mpRoomCode}</span>
              <button onClick={handleCopyCode} className="ml-2 text-primary-500 hover:text-primary-400"><FiCopy className="inline w-3 h-3" /></button>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <FiClock className="w-4 h-4 text-primary-500" />
              <span className={`font-bold ${mpTimeLeft <= 60 ? 'text-red-400' : 'text-primary-500'}`}>{formatTime(mpTimeLeft)}</span>
            </div>
            {isHost && mpState === 'waiting' && (
              <button onClick={handleStartMultiplayerGame} className="btn-primary text-sm px-4 py-2">Start Game</button>
            )}
            <button onClick={handleLeaveMultiplayer} className="btn-secondary text-sm px-3 py-2">Leave</button>
          </div>
        </div>

        {mpState === 'waiting' && (
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold mb-3">Players ({mpPlayers.length})</h2>
            <div className="flex flex-wrap gap-3">
              {mpPlayers.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${i === 0 ? 'gradient-bg text-white' : 'bg-[var(--bg-secondary)]'}`}>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {i === 0 ? '👑' : p.fullname.charAt(0)}
                  </span>
                  <span className="font-medium">{p.fullname}</span>
                  {p.userId === user.id && <span className="text-xs opacity-70">(You)</span>}
                </div>
              ))}
            </div>
            {mpPlayers.length < 2 && (
              <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                <FiUsers className="inline w-4 h-4 mr-1" /> Waiting for players... Share code: <span className="font-mono font-bold text-primary-500">{mpRoomCode}</span>
              </div>
            )}
          </div>
        )}

        {mpState === 'generating' && (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Generating crossword puzzle...</p>
          </div>
        )}

        {mpState === 'active' && mpPuzzle && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 glass-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FiGrid className="w-5 h-5 text-primary-500" />
                  {mpPuzzle.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> {formatTime(mpTimeLeft)}</span>
                  <span className="flex items-center gap-1"><FiStar className="w-4 h-4" /> {completedWords.size}/{totalWords}</span>
                </div>
              </div>
              <CrosswordGrid
                puzzle={mpPuzzle}
                onCellChange={handleCellChange}
                onWordCompleted={handleWordCompleted}
                onHintReveal={handleHint}
                revealedCells={revealedCells}
                completedWords={completedWords}
                onCellClick={({ row, col }) => setActiveCell({ row, col })}
                direction={direction}
                onDirectionChange={setDirection}
                cellHighlights={mpCellHighlights}
                userId={user.id}
              />
            </div>
            <div className="glass-card p-4 sm:p-6">
              <CrosswordClues
                across={mpPuzzle.across || []}
                down={mpPuzzle.down || []}
                completedWords={completedWords}
                activeClue={activeClue}
                onClueClick={handleClueClick}
                onHintClick={handleHint}
                hintsUsed={hintsUsed}
                maxHints={maxHints}
                cellHighlights={cellHighlights}
              />
            </div>
          </div>
        )}

        {mpState === 'active' && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><FiTrendingUp className="w-4 h-4" /> Live Progress</h3>
            <div className="space-y-1">
              {[...mpPlayers].sort((a, b) => (mpPlayerProgress[b.id]?.wordsCompleted || 0) - (mpPlayerProgress[a.id]?.wordsCompleted || 0)).map((p, i) => {
                const progress = mpPlayerProgress[p.id] || { wordsCompleted: 0, score: 0 };
                return (
                  <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${p.userId === user.id ? 'bg-primary-500/10' : ''}`}>
                    <span>{i + 1}. {p.fullname}{p.userId === user.id ? ' (You)' : ''}</span>
                    <span className="font-bold text-primary-500">{progress.wordsCompleted} words | {progress.score} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mpState === 'finished' && mpGameEnded && (
          <div className="glass-card p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-bold gradient-text">Game Over!</h2>
            </div>
            <div className="space-y-2">
              {mpLeaderboard.map((p, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'gradient-bg text-white' : i < 3 ? 'bg-primary-500/10' : 'bg-[var(--bg-secondary)]'}`}>
                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)} {p.fullname}</span>
                  <div><span className="font-bold">{p.wordsCompleted}/{p.totalWords} words</span> | <span>{p.score} pts</span></div>
                </div>
              ))}
            </div>
            <button onClick={handleLeaveMultiplayer} className="btn-primary mt-6 w-full text-sm">Back to Lobby</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FiGrid className="w-6 h-6" /> Crossword Puzzle
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">AI-powered STEM crossword puzzles</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('solo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'solo' ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)]'
            }`}>
            <FiZap className="inline w-3 h-3 mr-1" /> Solo
          </button>
          <button onClick={() => setMode('multiplayer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'multiplayer' ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)]'
            }`}>
            <FiUsers className="inline w-3 h-3 mr-1" /> Multiplayer
          </button>
        </div>
      </div>

      {!puzzle && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Generate Crossword</h2>

          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Choose a Topic</label>
            <div className="flex flex-wrap gap-2">
              {STEM_TOPICS.slice(0, 12).map(t => (
                <button key={t} onClick={() => { setTopic(t); setCustomTopic(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    topic === t ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                  {t}
                </button>
              ))}
              <button onClick={() => { setShowTopicInput(true); setTopic(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showTopicInput ? 'gradient-bg text-white' : 'glass text-[var(--text-secondary)]'
                }`}>
                Custom Topic...
              </button>
            </div>
            {showTopicInput && (
              <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                placeholder="Enter custom STEM topic..."
                className="input-field mt-2 text-sm" autoFocus />
            )}
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    difficulty === d.id ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                  <div className="text-lg mb-1">{d.icon}</div>
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-[10px] opacity-70">{d.words} words</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Time Limit</label>
              <select value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="input-field mt-1 text-sm">
                <option value={300}>5 min</option>
                <option value={600}>10 min</option>
                <option value={900}>15 min</option>
                <option value={1200}>20 min</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Words</label>
              <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="input-field mt-1 text-sm">
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => handleGeneratePuzzle(topic || customTopic)} disabled={generating || (!topic && !customTopic)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              {generating ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" /> Generating...</>
              ) : (
                <><FiZap className="w-4 h-4" /> Generate Crossword</>
              )}
            </button>
            <button onClick={() => { setPersonalized(true); handleGeneratePuzzle(topic || customTopic, true); }}
              disabled={generating || (!topic && !customTopic)}
              className="btn-secondary px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
              title="Generate based on your weak topics">
              <FiTarget className="w-4 h-4" /> Adaptive
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {puzzleCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="glass-card p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold gradient-text mb-1">Puzzle Complete!</h2>
            <p className="text-[var(--text-secondary)] mb-1">
              Score: <span className="text-primary-500 font-bold">{score} XP</span>
            </p>
            <p className="text-[var(--text-secondary)] text-sm mb-3">
              Time: {formatTime(timeElapsed)} | Hints: {hintsUsed}/{maxHints} | Words: {completedWords.size}/{totalWords}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setPuzzle(null); setPuzzleCompleted(false); }} className="btn-primary text-sm">
                <FiRefreshCw className="inline w-4 h-4 mr-1" /> New Puzzle
              </button>
              <button onClick={() => setShowBadges(true)} className="btn-secondary text-sm">
                <FiAward className="inline w-4 h-4 mr-1" /> Badges
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {puzzle && !puzzleCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FiGrid className="w-5 h-5 text-primary-500" />
                {puzzle.title}
              </h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <FiClock className="w-4 h-4" /> {formatTime(timeElapsed)}
                </span>
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <FiStar className="w-4 h-4" /> {completedWords.size}/{totalWords}
                </span>
                <span className="text-sm font-bold text-primary-500">{score} XP</span>
              </div>
            </div>

            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 mb-4">
              <motion.div className="gradient-bg h-1.5 rounded-full" initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
            </div>

            <CrosswordGrid
              ref={gridRef}
              puzzle={puzzle}
              onCellChange={handleCellChange}
              onWordCompleted={handleWordCompleted}
              onHintReveal={handleHint}
              revealedCells={revealedCells}
              completedWords={completedWords}
              onCellClick={({ row, col }) => setActiveCell({ row, col })}
              direction={direction}
              onDirectionChange={setDirection}
              cellHighlights={cellHighlights}
              userId={user?.id}
              checkMode={checkMode}
              wrongCells={wrongCells}
            />

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={handleCheckAnswers}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <FiEye className="w-3 h-3" /> Check
              </button>
              <button onClick={handleManualComplete}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <FiCheck className="w-3 h-3" /> Submit
              </button>
              <button onClick={() => { setPuzzle(null); setTimerRunning(false); }}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <FiArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6">
            <CrosswordClues
              across={puzzle.across || []}
              down={puzzle.down || []}
              completedWords={completedWords}
              activeClue={activeClue}
              onClueClick={handleClueClick}
              onHintClick={handleHint}
              hintsUsed={hintsUsed}
              maxHints={maxHints}
              cellHighlights={cellHighlights}
            />
          </div>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full text-left">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-primary-500" /> History
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">
            {showHistory ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-4">No puzzles completed yet</p>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id || i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
                      <div>
                        <span className={`badge-${h.difficulty === 'easy' ? 'success' : h.difficulty === 'medium' ? 'warning' : 'danger'}`}>{h.difficulty}</span>
                        <span className="ml-2 text-[var(--text-secondary)]">{h.completed_words}/{h.total_words} words</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary-500">{h.score} XP</div>
                        <div className="text-xs text-[var(--text-secondary)]">{h.time_taken}s</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {stats && stats.total_attempts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold gradient-text">{stats.total_attempts}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Total Puzzles</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.completed_count || 0}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Completed</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{Math.round(stats.avg_score || 0)}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Avg Score</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-primary-500">{stats.total_score || 0}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Total XP</div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showBadges && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBadges(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold gradient-text mb-4 text-center">Badges Earned</h2>
              <div className="space-y-2">
                {badges.map(b => {
                  const earned = earnedBadges.includes(b.name);
                  return (
                    <div key={b.name} className={`flex items-center gap-3 p-3 rounded-xl ${earned ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-[var(--bg-secondary)] opacity-50'}`}>
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{b.name}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">{b.desc}</div>
                      </div>
                      {earned && <span className="ml-auto text-primary-500 text-xs font-bold">Earned!</span>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowBadges(false)} className="btn-primary w-full mt-4 text-sm">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Crossword;
