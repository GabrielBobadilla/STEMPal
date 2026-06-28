import React from 'react';

const types = [
  { value: 'basic', label: 'Basic', icon: '📋', desc: 'Quick summary and key points' },
  { value: 'detailed', label: 'Detailed', icon: '📚', desc: 'In-depth comprehensive review' },
  { value: 'exam', label: 'Exam', icon: '🎯', desc: 'Exam-focused with practice questions' }
];

const ReviewTypeCard = ({ type, onTypeChange }) => (
  <div>
    <label className="block text-sm font-medium mb-2">Review Type</label>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {types.map((t) => (
        <button
          key={t.value}
          onClick={() => onTypeChange(t.value)}
          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
            type === t.value
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-[var(--glass-border)] hover:border-primary-300'
          }`}
        >
          <span className="text-2xl block mb-1">{t.icon}</span>
          <span className="font-semibold block">{t.label}</span>
          <span className="text-xs text-[var(--text-secondary)]">{t.desc}</span>
        </button>
      ))}
    </div>
  </div>
);

export { types };
export default ReviewTypeCard;
