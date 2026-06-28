import React from 'react';

const FlashcardStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4">
    {[
      { label: 'Mastered', value: stats?.mastered || 0, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
      { label: 'Learning', value: stats?.learning || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
      { label: 'To Review', value: stats?.toReview || 0, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    ].map((item, i) => (
      <div key={i} className={`${item.bg} ${item.border} border rounded-xl p-4 text-center`}>
        <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{item.label}</p>
      </div>
    ))}
  </div>
);

export default FlashcardStats;
