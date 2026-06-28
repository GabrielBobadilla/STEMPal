import React from 'react';

const AdaptiveSettingsPanel = ({ settings }) => (
  <div className="glass p-4 rounded-xl mb-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
    <div>
      <p className="text-lg font-bold gradient-text">{settings.study_duration || '?'}m</p>
      <p className="text-xs text-[var(--text-secondary)]">Focus</p>
    </div>
    <div>
      <p className="text-lg font-bold gradient-text">{settings.break_duration || '?'}m</p>
      <p className="text-xs text-[var(--text-secondary)]">Break</p>
    </div>
    <div>
      <p className="text-lg font-bold gradient-text">{settings.long_break_duration || '?'}m</p>
      <p className="text-xs text-[var(--text-secondary)]">Long Break</p>
    </div>
    {settings.focus_score !== undefined && (
      <div>
        <p className="text-lg font-bold gradient-text">{settings.focus_score}/5</p>
        <p className="text-xs text-[var(--text-secondary)]">Focus Score</p>
      </div>
    )}
    {settings.quiz_score !== undefined && (
      <div>
        <p className="text-lg font-bold gradient-text">{settings.quiz_score}%</p>
        <p className="text-xs text-[var(--text-secondary)]">Quiz Score</p>
      </div>
    )}
    {settings.recovery_break_suggested && (
      <div className="col-span-full">
        <span className="badge-warning text-xs">Recovery break suggested</span>
      </div>
    )}
  </div>
);

export default AdaptiveSettingsPanel;
