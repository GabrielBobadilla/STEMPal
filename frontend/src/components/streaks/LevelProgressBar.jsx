import React from 'react';
import { motion } from 'framer-motion';

const LevelProgressBar = ({ levelInfo }) => {
  if (!levelInfo) return null;
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold gradient-text mb-4">Level Progress</h2>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold">Level {levelInfo.level || 1}</p>
            <p className="text-xs text-[var(--text-secondary)]">{levelInfo.total_xp || 0} XP</p>
          </div>
        </div>
      </div>
      {levelInfo.next_level_xp > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>{levelInfo.current_level_xp || 0} XP</span>
            <span>{levelInfo.next_level_xp} XP</span>
          </div>
          <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((levelInfo.current_level_xp || 0) / levelInfo.next_level_xp) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full gradient-bg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelProgressBar;
