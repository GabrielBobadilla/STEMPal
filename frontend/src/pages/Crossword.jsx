import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiGrid, FiClock, FiStar, FiRefreshCw } from 'react-icons/fi';
import CrosswordGrid from '../components/crossword/CrosswordGrid';
import CrosswordClues from '../components/crossword/CrosswordClues';
import crosswordData from '../components/crossword/crosswordData';
import { crosswordAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const difficulties = ['easy', 'medium', 'hard'];

const Crossword = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzle, setPuzzle] = useState(null);
  const [completedWords, setCompletedWords] = useState(new Set());
  const [totalWords, setTotalWords] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [score, setScore] = useState(0);

  const maxHints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : 3;

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await crosswordAPI.getHistory();
      setHistory(res.data || []);
    } catch {}
  };

  const startNewPuzzle = useCallback((diff) => {
    const d = diff || difficulty;
    const puzzles = crosswordData[d];
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    setPuzzle(randomPuzzle);
    setCompletedWords(new Set());
    setTotalWords(randomPuzzle.words.length);
    setHintsUsed(0);
    setPuzzleCompleted(false);
    setTimeElapsed(0);
    setTimerRunning(true);
    setScore(0);
  }, [difficulty]);

  useEffect(() => {
    if (!puzzle) {
      startNewPuzzle();
    }
  }, [puzzle, startNewPuzzle]);

  const handleComplete = useCallback(async () => {
    setTimerRunning(false);
    setPuzzleCompleted(true);
    const baseScore = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
    const hintPenalty = hintsUsed * (difficulty === 'easy' ? 10 : 20);
    const timeBonus = Math.max(0, Math.floor((difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : 900) - timeElapsed) / 10);
    const finalScore = Math.max(0, baseScore + Math.round(timeBonus) - hintPenalty);

    setScore(finalScore);
    try {
      await crosswordAPI.saveScore({
        puzzle_data: puzzle,
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
    } catch {
      toast.error('Failed to save score');
    }
  }, [difficulty, puzzle, totalWords, completedWords, hintsUsed, timeElapsed]);

  const handleScoreUpdate = useCallback((correct, total) => {
    setCompletedWords(prev => {
      const next = new Set();
      for (let i = 0; i < total; i++) {
        if (i < correct) next.add(i);
      }
      return next;
    });
  }, []);

  const handleHint = useCallback((wordIdx) => {
    if (hintsUsed >= maxHints) {
      toast.warning('No hints remaining');
      return;
    }
    setHintsUsed(h => h + 1);
  }, [hintsUsed, maxHints]);

  const changeDifficulty = (d) => {
    setDifficulty(d);
    setTimeout(() => startNewPuzzle(d), 100);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!puzzle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Crossword Puzzle</h1>
          <p className="text-sm text-[var(--text-secondary)]">Fill in the grid with STEM words</p>
        </div>
        <div className="flex items-center gap-2">
          {difficulties.map(d => (
            <motion.button key={d} whileTap={{ scale: 0.95 }}
              onClick={() => changeDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                difficulty === d ? 'gradient-bg text-white shadow-lg' : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {d}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {puzzleCompleted && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold gradient-text mb-1">Puzzle Complete!</h2>
          <p className="text-[var(--text-secondary)] mb-3">You earned <span className="text-primary-500 font-bold">{score} XP</span></p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => startNewPuzzle()}
            className="btn-primary inline-flex items-center gap-2 text-sm">
            <FiRefreshCw className="w-4 h-4" /> New Puzzle
          </motion.button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiGrid className="w-5 h-5 text-primary-500" />
              {puzzle.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> {formatTime(timeElapsed)}</span>
              <span className="flex items-center gap-1"><FiStar className="w-4 h-4" /> {completedWords.size}/{totalWords}</span>
            </div>
          </div>
          <CrosswordGrid
            puzzle={puzzle}
            onComplete={handleComplete}
            onScoreUpdate={handleScoreUpdate}
            hintsUsed={hintsUsed}
            onUseHint={() => {}}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Clues</h2>
          <CrosswordClues
            puzzle={puzzle}
            completedWords={completedWords}
            onHint={handleHint}
            hintsUsed={hintsUsed}
            maxHints={maxHints}
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6">
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-left">
          <h2 className="text-lg font-semibold">History</h2>
          <span className="text-xs text-[var(--text-secondary)]">{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">No puzzles completed yet</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
                  <div>
                    <span className={`capitalize badge-${h.difficulty === 'easy' ? 'success' : h.difficulty === 'medium' ? 'warning' : 'danger'}`}>{h.difficulty}</span>
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
        )}
      </motion.div>
    </motion.div>
  );
};

export default Crossword;