import React from 'react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'quizzes', label: 'Quizzes', icon: '📝' },
  { key: 'reports', label: 'Reports', icon: '📋' }
];

const AdminTabs = ({ activeTab, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
          activeTab === tab.key
            ? 'gradient-bg text-white shadow-lg'
            : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);

export default AdminTabs;
