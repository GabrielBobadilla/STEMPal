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

const EffectivenessChart = ({ effectiveness }) => {
  if (!effectiveness?.activities?.length) return null;
  const maxVal = Math.max(...effectiveness.activities.map((a) => a.effectiveness || 0), 1);

  return (
    <div className="space-y-3">
      {effectiveness.activities.map((act, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-lg w-8 text-center">{getEmoji(act.name)}</span>
          <span className="text-sm text-[var(--text-secondary)] w-24 truncate">{act.name}</span>
          <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(act.effectiveness / maxVal) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="h-full rounded-full gradient-bg"
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{act.effectiveness}%</span>
        </div>
      ))}
    </div>
  );
};

export default EffectivenessChart;
