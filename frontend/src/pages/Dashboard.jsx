import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { analyticsAPI, quizAPI, streakAPI, searchAPI } from '../services/api';

const quotes = [
  "The only way to learn mathematics is to do mathematics. — Paul Halmos",
  "Science is a way of thinking much more than it is a body of knowledge. — Carl Sagan",
  "The important thing is not to stop questioning. — Albert Einstein",
  "In the middle of difficulty lies opportunity. — Albert Einstein",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
];

const quickCards = [
  { icon: '🤖', label: 'AI Reviewer', path: '/reviewer', color: 'from-sky-500 to-indigo-500' },
  { icon: '🎴', label: 'Flashcards', path: '/flashcards', color: 'from-sky-500 to-cyan-500' },
  { icon: '🧠', label: 'Quizzes', path: '/quiz', color: 'from-sky-500 to-cyan-500' },
  { icon: '👥', label: 'Multiplayer', path: '/multiplayer', color: 'from-purple-500 to-pink-500' },
  { icon: '🧩', label: 'Crossword', path: '/crossword', color: 'from-emerald-500 to-teal-500' },
  { icon: '⏱️', label: 'Pomodoro', path: '/pomodoro', color: 'from-violet-500 to-sky-500' },
  { icon: '🏆', label: 'Leaderboard', path: '/leaderboard', color: 'from-yellow-500 to-rose-500' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState(null);
  const [streak, setStreak] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataRes, sRes, qzRes] = await Promise.all([
          analyticsAPI.getDashboardData().catch(() => ({ data: null })),
          streakAPI.get().catch(() => ({ data: null })),
          quizAPI.getAll().catch(() => ({ data: [] }))
        ]);
        setData(dataRes.data);
        setStreak(sRes.data);
        setQuizzes(qzRes.data?.quizzes || qzRes.data || []);
      } catch {}
      streakAPI.update().catch(() => {});
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.search({ q: searchQuery.trim() });
        setSearchResults(res.data.results || res.data || []);
        setSearchOpen(true);
      } catch { setSearchResults([]); } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const todayStudy = data?.todayStudyTime || 0;
  const avgFocus = data?.avgFocus || 75;
  const currentStreak = streak?.current_streak || data?.currentStreak || 0;
  const totalXp = streak?.total_xp || user?.total_xp || 0;
  const level = streak?.level || user?.level || 'Beginner';
  const completedQuizzes = quizzes.filter(q => q.completed);
  const avgQuiz = completedQuizzes.length
    ? Math.round(completedQuizzes.reduce((a, q) => a + (q.accuracy || q.score || 0), 0) / completedQuizzes.length)
    : 0;
  const quote = quotes[Math.floor(time.getTime() / 86400000) % quotes.length];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.fullname?.split(' ')[0] || 'Student'}</span> 👋
          </motion.h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
            <span>⏰</span>
            <span className="font-mono text-sm font-medium">
              {time.toLocaleTimeString()}
            </span>
          </div>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:shadow-lg transition-all">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="relative">
        <div className="glass-card p-3 flex items-center gap-3">
          <span className="text-lg text-[var(--text-secondary)]">🔍</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="Search topics, notes, reviewers..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
          {searching && <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />}
          {searchQuery && !searching && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">✕</button>
          )}
        </div>
          {searchOpen && searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto border border-[var(--glass-border)]">
              {searchResults.map((r, i) => (
                <Link key={r._id || i} to={r.source === 'ai' || r.type === 'reviewer' ? `/reviewer/${r._id}` : r.source === 'human' || r.type === 'note' ? `/notes/${r._id}` : r.type === 'flashcard' ? `/flashcards/${r._id}` : r.type === 'quiz' ? `/quiz/${r._id}` : '#'}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <span className="text-lg">{r.source === 'ai' ? '🤖' : '📝'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title || r.name || 'Untitled'}</p>
                    {r.preview && <p className="text-xs text-[var(--text-secondary)] truncate">{r.preview}</p>}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-4 border border-primary-500/20">
        <p className="text-sm italic text-[var(--text-secondary)]">&ldquo;{quote}&rdquo;</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { icon: '⏰', label: 'Study Today', value: `${todayStudy}m`, sub: 'minutes' },
          { icon: '🎯', label: 'Focus Score', value: `${avgFocus}%`, sub: avgFocus > 80 ? 'Excellent' : avgFocus > 60 ? 'Good' : 'Needs Work' },
          { icon: '🔥', label: 'Streak', value: `${currentStreak}`, sub: 'days' },
          { icon: '⚡', label: 'XP', value: `${totalXp}`, sub: level },
          { icon: '🎯', label: 'Avg Quiz', value: `${avgQuiz}%`, sub: completedQuizzes.length ? `${completedQuizzes.length} taken` : 'No quizzes yet' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-xl gradient-bg mx-auto mb-2 flex items-center justify-center text-lg">
              {stat.icon}
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[var(--text-secondary)]">{stat.label}</div>
            <div className="text-xs text-primary-500 font-medium mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickCards.map((card, i) => (
            <Link key={card.path} to={card.path}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-4 text-center cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} mx-auto mb-2 flex items-center justify-center text-xl group-hover:shadow-lg transition-shadow`}>
                  {card.icon}
                </div>
                <span className="text-sm font-medium">{card.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>🏆</span> Recent Quizzes
          </h3>
          {completedQuizzes.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No quizzes taken yet. Start one now!</p>
          ) : (
            <div className="space-y-2">
              {completedQuizzes.slice(0, 4).map(q => {
                const acc = q.accuracy || q.score || 0;
                return (
                  <div key={q._id || q.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/50">
                    <div>
                      <div className="font-medium text-sm">{q.topic || q.title || 'Quiz'}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {new Date(q.createdAt || q.created_date || Date.now()).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${acc >= 80 ? 'text-green-500' : acc >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {acc}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>☕</span> Study Tips
          </h3>
          <div className="space-y-3">
            {[
              { tip: 'Take short breaks every 25 minutes', icon: '⏱️' },
              { tip: 'Review flashcards before sleep', icon: '🧠' },
              { tip: 'Stay hydrated while studying', icon: '💧' },
              { tip: 'Use active recall, not passive reading', icon: '📝' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <span className="text-lg">{t.icon}</span>
                <span className="text-sm text-[var(--text-secondary)]">{t.tip}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
