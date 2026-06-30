import React from 'react';
import { motion } from 'framer-motion';

const FOCUS_SCORES = [1, 2, 3, 4, 5];

const FocusScoreInput = ({ show, focusScore, onFocusScoreChange, onSubmit }) => (
  show ? (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-3">Rate Your Focus</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">How focused were you during this session?</p>
      <div className="flex items-center gap-3 mb-4">
        {FOCUS_SCORES.map((s) => (
          <button key={s} onClick={() => onFocusScoreChange(s)}
            className={`w-12 h-12 rounded-xl text-lg font-bold transition-all duration-200 ${
              focusScore === s ? 'gradient-bg text-white shadow-lg scale-110' : 'glass hover:scale-105 text-[var(--text-secondary)]'
            }`}>{s}</button>
        ))}
      </div>
      <button onClick={onSubmit} className="btn-primary text-sm px-6 py-2">Submit Score</button>
    </motion.div>
  ) : null
);

export default FocusScoreInput;