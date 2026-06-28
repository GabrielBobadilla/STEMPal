import React from 'react';
import { motion } from 'framer-motion';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getEmoji = (activity) => {
  const EMOTION_EMOJIS = {
    yoga: '🧘', meditation: '🧘‍♂️', stretch: '🤸', walk: '🚶', music: '🎵',
    snack: '🍎', hydrate: '💧', deep_breathing: '🌬️', eye_rest: '👁️',
    quick_nap: '😴', social: '💬', puzzle: '🧩', doodle: '✏️', nature: '🌿', dance: '💃'
  };
  if (!activity) return '☕';
  const key = activity.toLowerCase().replace(/\s+/g, '_');
  return EMOTION_EMOJIS[key] || '☕';
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const RecommendationCard = ({ recommendation, breakState, timeLeft, totalBreakTime, onStartBreak, onPauseBreak, onResumeBreak, onEndBreak, onDone }) => {
  const timerProgress = totalBreakTime > 0 ? (timeLeft / totalBreakTime) * 100 : 0;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
      <div className="text-center mb-6">
        <motion.span
          key={recommendation.activity}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-7xl block mb-3"
        >
          {getEmoji(recommendation.activity)}
        </motion.span>
        <h2 className="text-xl font-bold gradient-text">{recommendation.activity}</h2>
        <p className="text-[var(--text-secondary)] mt-2">{recommendation.reason}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-2xl font-bold gradient-text">{recommendation.duration || 5} min</p>
          <p className="text-xs text-[var(--text-secondary)]">Duration</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-2xl font-bold gradient-text">{recommendation.energy_boost || 'Medium'}</p>
          <p className="text-xs text-[var(--text-secondary)]">Energy Boost</p>
        </div>
      </div>

      {recommendation.benefits?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Benefits</h3>
          <div className="flex flex-wrap gap-2">
            {recommendation.benefits.map((b, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="badge-success flex items-center gap-1">
                <span>✦</span> {b}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {breakState === 'idle' && (
        <button onClick={onStartBreak} className="btn-primary w-full flex items-center justify-center gap-2">
          <span>▶</span> Start Break
        </button>
      )}

      {breakState !== 'idle' && (
        <div className="glass p-5 rounded-xl text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
              <motion.circle cx="64" cy="64" r="54" fill="none" stroke="url(#breakProgress)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={339.292}
                animate={{ strokeDashoffset: 339.292 * (1 - timerProgress / 100) }}
                transition={{ duration: 0.3 }} />
              <defs>
                <linearGradient id="breakProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {breakState === 'paused' && <p className="text-sm text-yellow-500 mb-3">⏸ Break Paused</p>}
          {breakState === 'completed' && <p className="text-sm text-green-500 mb-3">✓ Break Complete!</p>}

          <div className="flex items-center justify-center gap-3">
            {breakState === 'active' && (
              <button onClick={onPauseBreak} className="btn-secondary flex items-center gap-2">
                <span>⏸</span> Pause
              </button>
            )}
            {breakState === 'paused' && (
              <button onClick={onResumeBreak} className="btn-primary flex items-center gap-2">
                <span>▶</span> Resume
              </button>
            )}
            {breakState !== 'idle' && breakState !== 'completed' && (
              <button onClick={onEndBreak} className="btn-secondary flex items-center gap-2 text-red-400">
                <span>⏹</span> End
              </button>
            )}
            {breakState === 'completed' && (
              <button onClick={onDone} className="btn-primary">Done</button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecommendationCard;
