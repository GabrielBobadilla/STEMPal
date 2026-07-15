import React from 'react';
import { motion } from 'framer-motion';

const types = [
  {
    value: 'basic',
    label: 'Basic',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: 'from-sky-400 to-blue-500',
    desc: 'Quick summary and key points',
    features: ['Key Concepts', 'Definitions', 'Summary'],
  },
  {
    value: 'detailed',
    label: 'Detailed',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    color: 'from-violet-400 to-purple-600',
    desc: 'In-depth comprehensive review',
    features: ['Formula Sheets', 'Explanations', 'Practice Qs'],
  },
  {
    value: 'exam',
    label: 'Exam',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    color: 'from-amber-400 to-orange-600',
    desc: 'Exam-focused with practice',
    features: ['Practice Questions', 'Common Mistakes', 'Formulas'],
  },
];

const ReviewTypeCard = ({ type, onTypeChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {types.map((t) => {
      const active = type === t.value;
      return (
        <motion.button
          key={t.value}
          onClick={() => onTypeChange(t.value)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${
            active
              ? 'border-transparent shadow-lg shadow-primary-500/20'
              : 'border-[var(--glass-border)] hover:border-primary-300/50 bg-[var(--bg-secondary)]/50'
          }`}
        >
          {active && (
            <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-10`} />
          )}
          <div className={`relative z-10 ${active ? 'text-primary-400' : ''}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
              active ? `bg-gradient-to-br ${t.color} text-white shadow-lg` : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}>
              {t.icon}
            </div>
            <h3 className="font-bold text-lg mb-1">{t.label}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">{t.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {t.features.map((f) => (
                <span key={f} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  active ? 'bg-primary-500/20 text-primary-400' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                }`}>{f}</span>
              ))}
            </div>
          </div>
          {active && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </motion.button>
      );
    })}
  </div>
);

export { types };
export default ReviewTypeCard;