import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiGrid, FiCpu, FiLayers, FiHelpCircle, FiUsers, FiClock, FiGrid as FiGridIcon, FiCoffee, FiRefreshCw, FiUser, FiStar, FiSun, FiMoon } from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid, color: 'text-sky-400' },
  { path: '/reviewer', label: 'AI Reviewer', icon: FiCpu, color: 'text-violet-400' },
  { path: '/flashcards', label: 'Flashcards', icon: FiLayers, color: 'text-cyan-400' },
  { path: '/quiz', label: 'Quiz', icon: FiHelpCircle, color: 'text-amber-400' },
  { path: '/multiplayer', label: 'Multiplayer', icon: FiUsers, color: 'text-pink-400' },
  { path: '/pomodoro', label: 'Pomodoro', icon: FiClock, color: 'text-emerald-400' },
  { path: '/crossword', label: 'Crossword', icon: FiGridIcon, color: 'text-blue-400' },
  { path: '/breaks', label: 'Break', icon: FiCoffee, color: 'text-orange-400' },
  { path: '/history', label: 'History', icon: FiRefreshCw, color: 'text-teal-400' },
  { path: '/profile', label: 'Profile', icon: FiUser, color: 'text-indigo-400' },
  { path: '/leaderboard', label: 'Leaderboard', icon: FiStar, color: 'text-yellow-400' },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex-shrink-0 transform transition-all duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col m-3 ml-0 rounded-3xl overflow-hidden glass-panel" style={{ boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.20)' }}>
          <div className="p-5 flex-1 overflow-y-auto scrollbar-hide">
            <Link to="/dashboard" className="flex items-center gap-3 mb-8 group" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">STEMPal</h1>
                <p className="text-[10px] text-[var(--text-secondary)] tracking-wide uppercase">Smart Study Platform</p>
              </div>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-[#60C5FF]/15 to-[#8EEBFF]/10 text-[var(--text-primary)] shadow-sm border border-[#60C5FF]/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60 hover:text-[var(--text-primary)]'
                    }`}>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#60C5FF] to-[#8EEBFF]" />
                    )}
                    <item.icon className={`w-[18px] h-[18px] ${active ? item.color : ''}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-2 mb-2 px-1">
              <button onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60 hover:text-[var(--text-primary)] transition-all">
                {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)]/60 transition-all cursor-default">
                  <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                    {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user?.fullname || 'Student'}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full p-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 font-medium">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-h-screen">
        <button onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 rounded-xl glass flex items-center justify-center hover:shadow-lg transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
