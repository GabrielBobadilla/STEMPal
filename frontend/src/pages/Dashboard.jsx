import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { analyticsAPI, quizAPI, streakAPI, searchAPI } from '../services/api';
import { FiSearch, FiClock, FiSun, FiMoon, FiTrendingUp, FiTarget, FiZap, FiAward, FiBookOpen, FiArrowRight, FiCpu, FiLayers, FiHelpCircle, FiUsers, FiGrid, FiClock as FiClockIcon, FiStar } from 'react-icons/fi';

const quotes = [
  "The only way to learn mathematics is to do mathematics. — Paul Halmos",
  "Science is a way of thinking much more than it is a body of knowledge. — Carl Sagan",
  "The important thing is not to stop questioning. — Albert Einstein",
  "In the middle of difficulty lies opportunity. — Albert Einstein",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
];

const quickCards = [
  { icon: FiCpu, label: 'AI Reviewer', path: '/reviewer', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25', desc: 'Generate study materials' },
  { icon: FiLayers, label: 'Flashcards', path: '/flashcards', gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/25', desc: 'Review with spaced repetition' },
  { icon: FiHelpCircle, label: 'Quiz', path: '/quiz', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25', desc: 'Test your knowledge' },
  { icon: FiUsers, label: 'Multiplayer', path: '/multiplayer', gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/25', desc: 'Compete with friends' },
  { icon: FiGrid, label: 'Crossword', path: '/crossword', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/25', desc: 'AI-powered puzzles' },
  { icon: FiClockIcon, label: 'Pomodoro', path: '/pomodoro', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25', desc: 'Focused study sessions' },
  { icon: FiStar, label: 'Leaderboard', path: '/leaderboard', gradient: 'from-yellow-500 to-amber-500', shadow: 'shadow-yellow-500/25', desc: 'See top performers' },
];

const statColors = [
  { bg: 'from-blue-500/10 to-indigo-500/5', icon: 'text-blue-500', ring: 'ring-blue-500/20' },
  { bg: 'from-violet-500/10 to-purple-500/5', icon: 'text-violet-500', ring: 'ring-violet-500/20' },
  { bg: 'from-cyan-500/10 to-teal-500/5', icon: 'text-cyan-500', ring: 'ring-cyan-500/20' },
  { bg: 'from-amber-500/10 to-orange-500/5', icon: 'text-amber-500', ring: 'ring-amber-500/20' },
  { bg: 'from-emerald-500/10 to-green-500/5', icon: 'text-emerald-500', ring: 'ring-emerald-500/20' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

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

  const stats = [
    { icon: FiClock, label: 'Study Today', value: `${todayStudy}m`, sub: 'minutes', color: statColors[0] },
    { icon: FiTarget, label: 'Focus Score', value: `${avgFocus}%`, sub: avgFocus > 80 ? 'Excellent' : avgFocus > 60 ? 'Good' : 'Needs Work', color: statColors[1] },
    { icon: FiZap, label: 'Streak', value: `${currentStreak}`, sub: 'days', color: statColors[2] },
    { icon: FiAward, label: 'Total XP', value: `${totalXp}`, sub: level, color: statColors[3] },
    { icon: FiTrendingUp, label: 'Avg Quiz', value: `${avgQuiz}%`, sub: completedQuizzes.length ? `${completedQuizzes.length} taken` : 'No quizzes yet', color: statColors[4] },
  ];

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 hero-gradient text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.15),transparent_60%)]" />
        <svg className="absolute top-4 right-8 w-32 h-32 text-white/[0.06] animate-float" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <svg className="absolute bottom-4 left-8 w-20 h-20 text-white/[0.05] animate-float-delayed" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">{getGreeting()}</p>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {user?.fullname?.split(' ')[0] || 'Student'} 👋
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-white/10">
                <FiClock className="w-4 h-4 text-white/60" />
                <span className="font-mono text-sm font-medium">
                  {time.toLocaleTimeString()}
                </span>
              </div>
              <button onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all border border-white/10">
                {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 max-w-xl">
            <p className="text-sm italic text-white/70">&ldquo;{quote}&rdquo;</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative">
        <div className="glass-card p-3 flex items-center gap-3">
          <FiSearch className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
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
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto">
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

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={item}
            className={`glass-card p-4 text-center group cursor-default`}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color.bg} ring-1 ${stat.color.ring} mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 ${stat.color.icon}`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{stat.label}</div>
            <div className={`text-[11px] font-semibold mt-1 ${stat.color.icon}`}>{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiBookOpen className="w-5 h-5 text-sky-500" />
            Quick Access
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">{quickCards.length} tools</span>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {quickCards.map((card) => (
            <Link key={card.path} to={card.path}>
              <motion.div variants={item}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-4 text-center cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg mx-auto mb-3 flex items-center justify-center text-white group-hover:scale-110 group-hover:shadow-xl transition-all`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold block">{card.label}</span>
                <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block leading-tight">{card.desc}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FiAward className="w-5 h-5 text-violet-500" /> Recent Quizzes
            </h3>
            {completedQuizzes.length > 0 && (
              <Link to="/quiz" className="text-xs text-sky-500 hover:text-sky-400 font-medium flex items-center gap-1">
                View all <FiArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {completedQuizzes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 flex items-center justify-center mx-auto mb-3">
                <FiHelpCircle className="w-7 h-7 text-violet-400" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">No quizzes taken yet</p>
              <Link to="/quiz" className="text-xs text-sky-500 hover:text-sky-400 font-medium mt-1 inline-block">Start one now</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {completedQuizzes.slice(0, 4).map(q => {
                const acc = q.accuracy || q.score || 0;
                return (
                  <div key={q._id || q.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)]/60 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                        acc >= 80 ? 'bg-emerald-500/15 text-emerald-500' : acc >= 60 ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'
                      }`}>
                        {acc}%
                      </div>
                      <div>
                        <div className="font-medium text-sm">{q.topic || q.title || 'Quiz'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {new Date(q.createdAt || q.created_date || Date.now()).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FiZap className="w-5 h-5 text-amber-500" /> Study Tips
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { tip: 'Take short breaks every 25 minutes', icon: '⏱️', color: 'from-blue-500/10 to-cyan-500/5' },
              { tip: 'Review flashcards before sleep', icon: '🧠', color: 'from-violet-500/10 to-purple-500/5' },
              { tip: 'Stay hydrated while studying', icon: '💧', color: 'from-cyan-500/10 to-teal-500/5' },
              { tip: 'Use active recall, not passive reading', icon: '📝', color: 'from-amber-500/10 to-orange-500/5' },
            ].map((t, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r ${t.color} border border-[var(--glass-border)]`}>
                <span className="text-lg mt-0.5">{t.icon}</span>
                <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.tip}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
