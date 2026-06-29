import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/reviewer', label: 'AI Reviewer', icon: '🤖' },
  { path: '/flashcards', label: 'Flashcards', icon: '🎴' },
  { path: '/quiz', label: 'Quiz', icon: '📝' },
  { path: '/pomodoro', label: 'Pomodoro', icon: '⏱️' },
  { path: '/breaks', label: 'Break', icon: '☕' },
  { path: '/history', label: 'History', icon: '📚' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
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
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex-shrink-0 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full glass overflow-y-auto scrollbar-hide flex flex-col">
          <div className="p-6 flex-1">
            <Link to="/dashboard" className="flex items-center gap-3 mb-8" onClick={() => setSidebarOpen(false)}>
              <img src="/stempal-logo.jpg" alt="STEMPal" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold gradient-text">STEMPal</h1>
                <p className="text-xs text-[var(--text-secondary)]">Smart Study Platform</p>
              </div>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path) ? 'gradient-bg text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-[var(--glass-border)] space-y-2">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-[var(--text-secondary)] mb-2">XP Points</p>
              <p className="text-2xl font-bold gradient-text">{user?.total_xp || 0}</p>
            </div>
            <button onClick={handleLogout} className="w-full p-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
              🚪 Logout
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
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
