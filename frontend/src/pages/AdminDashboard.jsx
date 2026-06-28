import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, pomodoroAPI } from '../services/api';
import { toast } from 'react-toastify';

const timeAgo = (date) => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    const load = async () => {
      try {
        const [statsRes, usersRes, quizRes, sessionRes] = await Promise.all([
          adminAPI.getDashboardStats().catch(() => ({ data: {} })),
          adminAPI.getUsers({}).catch(() => ({ data: [] })),
          adminAPI.getQuizStats().catch(() => ({ data: [] })),
          pomodoroAPI.getSessions().catch(() => ({ data: [] }))
        ]);
        const stats = statsRes.data;
        setUsers(usersRes.data?.users || usersRes.data || stats?.recentUsers || []);
        setNotes(stats?.recentReviewers || stats?.recentNotes || []);
        setQuizzes(quizRes.data?.quizzes || quizRes.data || stats?.recentQuizzes || []);
        setSessions(sessionRes.data?.sessions || sessionRes.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  const todayUsers = users.filter(u => {
    const d = new Date(u.createdAt || u.created_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <span className="gradient-text">&#128737; Admin Panel</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Platform management and analytics</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: '👥', label: 'Total Users', value: users.length, color: 'from-blue-500 to-indigo-500' },
          { icon: '🤖', label: 'Reviewers', value: notes.length, color: 'from-blue-500 to-cyan-500' },
          { icon: '📝', label: 'Quizzes', value: quizzes.length, color: 'from-sky-500 to-cyan-500' },
          { icon: '⏱️', label: 'Sessions', value: sessions.length, color: 'from-emerald-500 to-green-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="glass-card p-4 sm:p-5 text-center">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} mx-auto mb-2 flex items-center justify-center text-xl`}>
              {s.icon}
            </div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-[var(--text-secondary)]">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['overview', 'users', 'content', 'quizzes'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
              tab === t ? 'gradient-bg text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="font-semibold mb-3">Recent Users</h3>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u._id || u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(u.fullname || u.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.fullname || u.full_name || 'Unknown'}</div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] shrink-0">{timeAgo(u.createdAt || u.created_date)}</span>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">No users yet</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {sessions.slice(0, 5).map(s => (
                <div key={s._id || s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium capitalize">{s.phase || s.activity_type || 'Study'}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{s.mode || 'General'} &bull; {s.study_duration || s.duration_minutes || 0}min</div>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] shrink-0">{timeAgo(s.createdAt || s.created_date)}</span>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">No activity yet</p>}
            </div>
          </motion.div>
        </div>
      )}

      {tab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="font-semibold mb-3">All Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-secondary)] border-b border-[var(--glass-border)] text-left">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id || u.id} className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--bg-secondary)]/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{u.fullname || u.full_name || 'N/A'}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--text-secondary)]">{new Date(u.createdAt || u.created_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-[var(--text-secondary)]">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === 'content' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="font-semibold mb-3">Generated Content</h3>
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n._id || n.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/50 transition-colors">
                <div>
                  <div className="text-sm font-medium">{n.title || n.topic || 'Untitled'}</div>
                  <div className="text-xs text-[var(--text-secondary)] capitalize">{n.type || n.reviewer_type || 'Reviewer'} &bull; {n.source || 'AI'}</div>
                </div>
                <span className="text-xs text-[var(--text-secondary)] shrink-0">{timeAgo(n.createdAt || n.created_date)}</span>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">No content yet</p>}
          </div>
        </motion.div>
      )}

      {tab === 'quizzes' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="font-semibold mb-3">Quiz Statistics</h3>
          <div className="space-y-2">
            {quizzes.map(q => {
              const acc = q.accuracy || q.avgScore || q.score || 0;
              return (
                <div key={q._id || q.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{q.topic || q.title || 'Quiz'}</div>
                    <div className="text-xs text-[var(--text-secondary)] capitalize">
                      {q.category || q.quiz_type || 'General'} &bull; {q.difficulty || 'Medium'} &bull; {q.total_questions || q.questionCount || q.questions?.length || 0} questions
                    </div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${acc >= 80 ? 'text-green-500' : acc >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {acc}%
                  </div>
                </div>
              );
            })}
            {quizzes.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">No quizzes yet</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
