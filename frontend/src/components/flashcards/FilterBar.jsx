import React from 'react';

const FILTER_TABS = ['All', 'Favorites', 'Due for Review'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const FilterBar = ({ filter, difficulty, onFilterChange, onDifficultyChange }) => (
  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div className="flex gap-2">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onFilterChange(tab)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === tab ? 'gradient-bg text-white' : 'glass border border-white/10 text-[var(--text-secondary)]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
    <div className="flex gap-2">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          onClick={() => onDifficultyChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
            difficulty === d ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'glass border border-white/10 text-[var(--text-secondary)]'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  </div>
);

export { FILTER_TABS, DIFFICULTIES };
export default FilterBar;
