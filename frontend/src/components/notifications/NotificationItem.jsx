import React from 'react';
import { motion } from 'framer-motion';

const TYPE_ICONS = {
  study_reminder: '📚', break: '☕', streak: '🔥', quiz: '📝', achievement: '🏆'
};

const TYPE_COLORS = {
  study_reminder: 'from-blue-500 to-indigo-500', break: 'from-green-500 to-teal-500',
  streak: 'from-orange-500 to-red-500', quiz: 'from-purple-500 to-pink-500',
  achievement: 'from-yellow-500 to-amber-500'
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const typeKey = (notification.type || '').toLowerCase().replace(/\s+/g, '_');
  const icon = TYPE_ICONS[typeKey] || '🔔';
  const color = TYPE_COLORS[typeKey] || 'from-gray-500 to-gray-400';
  const isRead = notification.read || notification.isRead;

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => !isRead && onClick(notification._id)}
      className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all duration-300 ${
        !isRead ? 'ring-1 ring-purple-500/30 bg-purple-500/5' : 'opacity-75'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={`font-semibold text-sm ${!isRead ? 'text-[var(--text-primary)]' : ''}`}>
            {notification.title || 'Notification'}
          </h3>
          {!isRead && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
        </div>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
          {notification.message || notification.body || ''}
        </p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          {formatTime(notification.createdAt || notification.timestamp)}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
        className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
        title="Delete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
};

export default NotificationItem;
