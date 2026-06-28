import React from 'react';

const renderSectionContent = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-semibold text-primary-400 min-w-[120px]">{key.replace(/_/g, ' ')}:</span>
            <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p>{String(data)}</p>;
};

const SectionCard = ({ icon, title, content }) => (
  <div className="glass-card p-5">
    <h3 className="font-semibold mb-3 flex items-center gap-2">
      <span>{icon}</span>
      {title}
    </h3>
    <div className="text-sm text-[var(--text-primary)] leading-relaxed">
      {renderSectionContent(content)}
    </div>
  </div>
);

export default SectionCard;
