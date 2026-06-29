import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { reviewerAPI } from '../../services/api';
import { toast } from 'react-toastify';

const typeMeta = {
  basic: { icon: '📋', label: 'Basic', color: 'bg-sky-500/20 text-sky-400' },
  detailed: { icon: '📚', label: 'Detailed', color: 'bg-violet-500/20 text-violet-400' },
  exam: { icon: '🎯', label: 'Exam', color: 'bg-amber-500/20 text-amber-400' },
};

const HistoryList = ({ history, loading, onRefresh, onSelect }) => {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await reviewerAPI.delete(id);
      toast.success('Reviewer deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-primary-500/30" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] font-medium">No reviewers yet</p>
        <p className="text-sm text-[var(--text-secondary)]/60 mt-1">Generate your first reviewer above</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide pr-1">
      {history.map((item, i) => {
        const meta = typeMeta[item.reviewer_type] || typeMeta.basic;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(item)}
            className="group flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-secondary)]/50 hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20 cursor-pointer transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center text-lg shrink-0`}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.topic || item.title || 'Untitled'}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className={`px-1.5 py-0.5 rounded ${meta.color} text-[10px]`}>{meta.label}</span>
                <span>•</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
              </div>
            </div>
            <button onClick={(e) => handleDelete(e, item.id)} disabled={deleting === item.id}
              className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
            >
              {deleting === item.id ? (
                <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HistoryList;