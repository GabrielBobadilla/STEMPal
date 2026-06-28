import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const StreakStats = ({ currentStreak, longestStreak, levelInfo }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <motion.div variants={itemVariants} className="glass-card p-6 text-center">
      <motion.span key={currentStreak} initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-6xl block mb-3">🔥</motion.span>
      <p className="text-4xl font-bold gradient-text">{currentStreak}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">Current Streak</p>
    </motion.div>
    <motion.div variants={itemVariants} className="glass-card p-6 text-center">
      <motion.span key={longestStreak} initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="text-6xl block mb-3">🏆</motion.span>
      <p className="text-4xl font-bold gradient-text">{longestStreak}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">Longest Streak</p>
    </motion.div>
    {levelInfo && (
      <motion.div variants={itemVariants} className="glass-card p-6 text-center">
        <motion.span initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-6xl block mb-3">⚡</motion.span>
        <p className="text-4xl font-bold gradient-text">{levelInfo.total_xp || 0}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Total XP</p>
        {levelInfo.level && (
          <div className="mt-2">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="badge-primary text-xs">
              Level {levelInfo.level}
            </motion.span>
          </div>
        )}
      </motion.div>
    )}
  </div>
);

export default StreakStats;
