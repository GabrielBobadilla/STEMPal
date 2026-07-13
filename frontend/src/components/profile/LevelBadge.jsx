import React from 'react';

const LevelBadge = ({ levelInfo, ranking }) => (
  <div>
    {levelInfo && (
      <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
        <span className="glass px-3 py-1 rounded-full text-sm font-medium">
          Lvl {levelInfo.level}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          {levelInfo.xp} / {levelInfo.xpToNext} XP
        </span>
        {ranking && (
          <span className="text-sm text-[var(--text-secondary)]">
            #{ranking.rank} on leaderboard
          </span>
        )}
      </div>
    )}
    {levelInfo && (
      <div className="mt-2 w-full max-w-xs bg-[var(--glass-bg)] rounded-full h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, (levelInfo.xp / levelInfo.xpToNext) * 100)}%` }} />
      </div>
    )}
  </div>
);

export default LevelBadge;
