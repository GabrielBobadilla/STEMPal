import React from 'react';
import { motion } from 'framer-motion';

const CrosswordClues = ({ puzzle, completedWords, onHint, hintsUsed, maxHints }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary-500 mb-1">Clues</h3>
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {puzzle.words.map((word, idx) => {
          const isCompleted = completedWords.has(idx);
          return (
            <div key={idx}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${isCompleted ? 'bg-green-500/10 text-green-400' : 'hover:bg-[var(--bg-secondary)]'}`}
            >
              <span className="font-bold text-primary-500 min-w-[20px]">{idx + 1}.</span>
              <span className={`flex-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>{word.clue}</span>
              {isCompleted && <span className="text-green-400 text-xs shrink-0">✓</span>}
              {!isCompleted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onHint(idx)}
                  disabled={hintsUsed >= maxHints}
                  className={`text-xs px-2 py-1 rounded-lg transition-all shrink-0 ${
                    hintsUsed >= maxHints ? 'opacity-30 cursor-not-allowed' : 'bg-primary-500/20 text-primary-500 hover:bg-primary-500/30'
                  }`}
                >
                  💡
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-[var(--text-secondary)] text-center pt-2 border-t border-[var(--glass-border)]">
        Hints: {hintsUsed}/{maxHints}
      </div>
    </div>
  );
};

export default CrosswordClues;