import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const WeeklyChart = ({ dailyMinutes }) => {
  if (!dailyMinutes || dailyMinutes.length === 0) return null;
  const maxVal = Math.max(...dailyMinutes.map(x => x.minutes), 1);
  return (
    <motion.div variants={itemVariants} className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">This Week's Study Time</h2>
      <div className="flex items-end gap-2 h-32">
        {dailyMinutes.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full rounded-lg gradient-bg transition-all duration-500 hover:opacity-80"
              style={{ height: `${Math.max(8, (d.minutes / maxVal) * 100)}%` }} />
            <span className="text-xs text-[var(--text-secondary)]">
              {new Date(d.day).toLocaleDateString('en', { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WeeklyChart;
