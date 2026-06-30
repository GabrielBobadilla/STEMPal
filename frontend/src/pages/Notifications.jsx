import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { toast } from 'react-toastify';

const typeIcons = {
  study_reminder: '📖', break_reminder: '☕', streak_reminder: '🔥',
  goal_completion: '🎯', quiz_ready: '🧠', reviewer_generated: '✨',
  achievement: '🏆', study: '📖', break: '☕', streak: '🔥',
  quiz: '🧠'
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data?.notifications || res.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            🔔 Notifications
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            ✅ Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">🔔</p>
          <p className="text-lg font-semibold mb-1">No notifications yet</p>
          <p className="text-sm text-[var(--text-secondary)]">You'll be notified about study reminders, achievements, and more</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div key={n._id}>
              <div className={`glass-card p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-primary-500/20 bg-primary-500/5' : ''}`}>
                <span className="text-2xl">{typeIcons[n.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title || n.message?.substring(0, 60)}</h4>
                  {n.message && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>}
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.read && (
                    <button onClick={() => handleMarkAsRead(n._id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
                      ✅
                    </button>
                  )}
                  <button onClick={() => handleDelete(n._id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
