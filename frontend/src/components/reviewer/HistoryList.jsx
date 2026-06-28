import React from 'react';
import { motion } from 'framer-motion';

const typeIcons = {
  basic: '📋', detailed: '📚', exam: '🎯'
};

const HistoryList = ({ history, loading, onRefresh, onSelect }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-center text-[var(--text-secondary)] py-8">No reviewers generated yet</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
      {history.map((item, i) => (
        <motion.div
          key={item.id || i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 rounded-xl bg-[var(--bg-secondary)] cursor-pointer hover:bg-primary-500/5 transition-colors"
          onClick={() => onSelect(item)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.topic || item.title || 'Untitled'}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {item.type || 'basic'} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
            <span className="text-lg">{typeIcons[item.type] || '📋'}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HistoryList;
