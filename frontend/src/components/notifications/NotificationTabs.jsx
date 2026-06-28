import React from 'react';

const TYPE_TABS = ['All', 'Study Reminder', 'Break', 'Streak', 'Quiz', 'Achievement'];

const NotificationTabs = ({ activeTab, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {TYPE_TABS.map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`px-4 py-2 rounded-xl font-medium text-xs transition-all duration-300 ${
          activeTab === tab
            ? 'gradient-bg text-white shadow-lg'
            : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default NotificationTabs;
