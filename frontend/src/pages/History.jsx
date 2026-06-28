import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { studyAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const FILTER_TABS = ['Daily', 'Weekly', 'Monthly'];
const ACTIVITY_TYPES = ['All', 'Study', 'Quiz', 'Flashcard', 'PDF', 'Break'];

const ACTIVITY_ICONS = {
  Study: '📖',
  Quiz: '📝',
  Flashcard: '🎴',
  PDF: '📄',
  Break: '☕'
};

const History = () => {
  const [filterTab, setFilterTab] = useState('Daily');
  const [activityFilter, setActivityFilter] = useState('All');
  const [sessions, setSessions] = useState([]);
  const [totalStats, setTotalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const fetchHistory = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await studyAPI.getHistory({
        type: activityFilter === 'All' ? undefined : activityFilter.toLowerCase(),
        limit: LIMIT,
        offset: currentOffset
      });
      const newSessions = res.data.sessions || res.data;
      if (reset) {
        setSessions(newSessions);
      } else {
        setSessions(prev => [...prev, ...newSessions]);
      }
      setHasMore(newSessions.length === LIMIT);
      setOffset(currentOffset + newSessions.length);
    } catch {
      toast?.error?.('Failed to load history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, activityFilter]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchHistory(true);
  }, [filterTab, activityFilter]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await studyAPI.getTotalStats();
        setTotalStats(res.data);
      } catch {}
    };
    fetchStats();
  }, []);

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActivityIcon = (type) => ACTIVITY_ICONS[type] || '📌';

  const summaryStats = [
    { label: 'Total Sessions', value: totalStats?.totalSessions ?? '—', icon: '📊' },
    { label: 'Total Minutes', value: totalStats?.totalMinutes ? formatDuration(totalStats.totalMinutes) : '—', icon: '⏱️' },
    { label: 'Days Active', value: totalStats?.daysActive ?? '—', icon: '📅' }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {summaryStats.map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-xl font-bold gradient-text">{stat.value}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActivityFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activityFilter === type
                  ? 'bg-primary-500/20 text-primary-500 border border-primary-500/30'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--glass-border)]'
              }`}
            >
              {type !== 'All' && <span className="mr-1">{getActivityIcon(type)}</span>}
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <motion.div variants={itemVariants} className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </motion.div>
      ) : sessions.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-card p-8 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-lg font-medium">No study sessions yet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Start studying to see your history here</p>
        </motion.div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--glass-border)]" />
            {sessions.map((session, i) => (
              <motion.div key={session._id || i} variants={itemVariants} className="relative pl-14 pb-6">
                <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-[var(--bg-primary)] border-2 border-primary-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getActivityIcon(session.type)}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{session.title || session.type || 'Study Session'}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{formatDate(session.date || session.createdAt)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary-500 whitespace-nowrap">
                      {formatDuration(session.duration || session.minutes)}
                    </span>
                  </div>
                  {session.details && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2">{session.details}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <motion.div variants={itemVariants} className="text-center">
              <button
                onClick={() => fetchHistory(false)}
                disabled={loadingMore}
                className="btn-secondary inline-flex items-center gap-2"
              >
                {loadingMore && <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default History;
