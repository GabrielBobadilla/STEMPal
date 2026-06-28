import React from 'react';
import { motion } from 'framer-motion';

const getEmoji = (activity) => {
  const map = {
    yoga: '🧘', meditation: '🧘‍♂️', stretch: '🤸', walk: '🚶', music: '🎵',
    snack: '🍎', hydrate: '💧', deep_breathing: '🌬️', eye_rest: '👁️',
    quick_nap: '😴', social: '💬', puzzle: '🧩', doodle: '✏️', nature: '🌿', dance: '💃'
  };
  if (!activity) return '☕';
  return map[activity.toLowerCase().replace(/\s+/g, '_')] || '☕';
};

const BreakHistory = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-[var(--text-secondary)]">No break history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.slice(0, 10).map((entry, i) => (
        <motion.div
          key={entry.id || i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-secondary)]"
        >
          <span className="text-2xl">{getEmoji(entry.activity)}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{entry.activity}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {entry.duration} min
              {entry.completed && <span className="text-green-500 ml-2">✓ Completed</span>}
            </p>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default BreakHistory;
