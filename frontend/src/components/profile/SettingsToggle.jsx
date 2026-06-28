import React from 'react';

const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${enabled ? 'bg-primary-500' : 'bg-gray-300'}`}
  >
    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-8' : 'translate-x-1'}`} />
  </button>
);

const SettingsToggle = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
    <ToggleSwitch enabled={enabled} onChange={onChange} />
  </div>
);

export { ToggleSwitch };
export default SettingsToggle;
