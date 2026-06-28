import React from 'react';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const QuizTimer = ({ timeLeft }) => (
  <span className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
    {formatTime(timeLeft)}
  </span>
);

export default QuizTimer;
