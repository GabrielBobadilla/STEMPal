import React from 'react';

const BreakForm = ({ focusLevel, studyTime, quizScore, loading, onFocusLevelChange, onStudyTimeChange, onQuizScoreChange, onRecommend }) => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium mb-2">Focus Level (1-10)</label>
        <input type="range" min="1" max="10" value={focusLevel}
          onChange={(e) => onFocusLevelChange(Number(e.target.value))}
          className="w-full accent-sky-500" />
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
          <span>Low</span>
          <span className="font-bold text-sky-500">{focusLevel}/10</span>
          <span>High</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Study Time (minutes)</label>
        <input type="number" min="5" max="480" value={studyTime}
          onChange={(e) => onStudyTimeChange(Number(e.target.value))}
          className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Quiz Score (%)</label>
        <input type="number" min="0" max="100" value={quizScore}
          onChange={(e) => onQuizScoreChange(Number(e.target.value))}
          className="input-field" />
      </div>
    </div>
    <button onClick={onRecommend} disabled={loading}
      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          Analyzing...
        </>
      ) : 'Get Break Recommendation'}
    </button>
  </div>
);

export default BreakForm;
