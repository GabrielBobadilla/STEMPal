import React from 'react';

const PERIODS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' }
];

const PeriodToggle = ({ period, onChange }) => (
  <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl">
    {PERIODS.map((p) => (
      <button
        key={p.key}
        onClick={() => onChange(p.key)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          period === p.key
            ? 'gradient-bg text-white shadow-md'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {p.label}
      </button>
    ))}
  </div>
);

export default PeriodToggle;
