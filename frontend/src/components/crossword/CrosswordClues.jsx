import React, { useState } from 'react';

const CrosswordClues = ({
  across,
  down,
  completedWords,
  activeClue,
  onClueClick,
  onHintClick,
  hintsUsed,
  maxHints,
  cellHighlights,
}) => {
  const [activeTab, setActiveTab] = useState('across');
  const [collapsed, setCollapsed] = useState(false);

  const clues = activeTab === 'across' ? across : down;
  const completedKey = (entry) => `${entry.direction}-${entry.number}`;
  const isActiveClue = (entry) => activeClue && activeClue.number === entry.number && activeClue.direction === entry.direction;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setActiveTab('across')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'across'
              ? 'gradient-bg text-white shadow-md'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Across ({across.length})
        </button>
        <button
          onClick={() => setActiveTab('down')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'down'
              ? 'gradient-bg text-white shadow-md'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Down ({down.length})
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-[10px] text-[var(--text-secondary)] mb-2 hover:text-[var(--text-primary)] transition-colors"
      >
        {collapsed ? 'Show clues' : 'Hide clues'}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-hide max-h-[50vh] lg:max-h-[calc(100vh-300px)]">
          {clues.map((entry) => {
            const isCompleted = completedWords?.has(completedKey(entry));
            const isActive = isActiveClue(entry);
            const hasHighlights = entry.direction === activeTab && cellHighlights;

            return (
              <div
                key={completedKey(entry)}
                onClick={() => onClueClick && onClueClick(entry)}
                className={`
                  flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${isCompleted
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : isActive
                      ? 'bg-primary-500/15 border border-primary-500/30 shadow-sm'
                      : 'bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border border-transparent'
                  }
                `}
              >
                <span className={`
                  min-w-[24px] h-6 flex items-center justify-center rounded-lg text-xs font-bold shrink-0
                  ${isCompleted
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : isActive
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }
                `}>
                  {entry.number}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${
                    isCompleted
                      ? 'line-through text-emerald-400/70'
                      : isActive
                        ? 'text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)]'
                  }`}>
                    {entry.clue}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]/50 mt-0.5">
                    {entry.answer.length} letters
                  </p>
                </div>

                {isCompleted && (
                  <span className="text-emerald-400 text-sm shrink-0 mt-0.5">✓</span>
                )}

                {!isCompleted && onHintClick && hintsUsed < maxHints && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHintClick(entry);
                    }}
                    className="text-[10px] px-1.5 py-1 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-all shrink-0"
                    title="Reveal letter"
                  >
                    💡
                  </button>
                )}
              </div>
            );
          })}

          {clues.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center py-6">
              No {activeTab} clues available
            </p>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
        <span>
          Hints: {hintsUsed}/{maxHints}
        </span>
        <span>
          {completedWords?.size || 0} words done
        </span>
      </div>
    </div>
  );
};

export default CrosswordClues;
