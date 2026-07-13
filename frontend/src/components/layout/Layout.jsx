import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiCpu, FiLayers, FiHelpCircle, FiUsers, FiClock, FiGrid as FiGridIcon, FiCoffee, FiRefreshCw, FiUser, FiAward } from 'react-icons/fi';

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
  { path: '/leaderboard', label: 'Leaderboard', icon: FiAward, color: 'text-yellow-400' },
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
    <div className="min-h-screen flex bg-mesh">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex-shrink-0 transform transition-all duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', borderRight: '1px solid var(--glass-border)' }}>
          <div className="p-6 flex-1">
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
                        ? 'bg-gradient-to-r from-sky-500/15 to-violet-500/10 text-[var(--text-primary)] shadow-sm border border-sky-500/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-sky-400 to-violet-500" />
                    )}
                    <item.icon className={`w-[18px] h-[18px] ${active ? item.color : 'group-hover:' + item.color}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center text-white text-xs font-bold shadow-md">
                {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.fullname || 'Student'}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full p-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
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
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
