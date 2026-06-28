import React from 'react';

const QuestionNav = ({ total, currentIndex, answers, onNavigate }) => (
  <div className="flex flex-wrap gap-2 justify-center">
    {Array.from({ length: total }, (_, i) => {
      const q = Object.keys(answers)[i];
      const isAnswered = q && answers[q]?.trim();
      return (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
            i === currentIndex
              ? 'gradient-bg text-white'
              : isAnswered
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'glass border border-white/10 text-[var(--text-secondary)]'
          }`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

export default QuestionNav;
