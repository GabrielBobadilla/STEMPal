import React from 'react';

const PhaseLabel = ({ phase }) => {
  const labels = {
    study: { text: 'Focus Time', color: 'text-blue-500' },
    break: { text: 'Short Break', color: 'text-green-500' },
    longBreak: { text: 'Long Break', color: 'text-purple-500' }
  };
  const current = labels[phase] || labels.study;
  return <span className={`text-lg font-semibold ${current.color}`}>{current.text}</span>;
};

export default PhaseLabel;
