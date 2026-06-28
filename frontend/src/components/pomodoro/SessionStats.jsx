import React from 'react';

const SessionStats = ({ sessionCount, totalSessions, currentMinutes, phaseLabel }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
    <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
      <p className="text-lg font-bold gradient-text">{sessionCount}</p>
      <p className="text-xs text-[var(--text-secondary)]">Sessions Done</p>
    </div>
    <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
      <p className="text-lg font-bold gradient-text">{totalSessions}</p>
      <p className="text-xs text-[var(--text-secondary)]">Target</p>
    </div>
    <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
      <p className="text-lg font-bold gradient-text">{currentMinutes}m</p>
      <p className="text-xs text-[var(--text-secondary)]">This Session</p>
    </div>
    <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
      <p className="text-lg font-bold gradient-text capitalize">{phaseLabel}</p>
      <p className="text-xs text-[var(--text-secondary)]">Current Phase</p>
    </div>
  </div>
);

export default SessionStats;
