import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiCpu, FiLayers, FiHelpCircle, FiUsers, FiClock, FiGrid as FiGridIcon, FiCoffee, FiRefreshCw, FiUser, FiStar, FiLogOut, FiChevronLeft, FiMenu } from 'react-icons/fi';

const navSections = [
  {
    title: 'HOME',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid, color: 'text-sky-400' },
    ],
  },
  {
    title: 'AI LEARNING',
    items: [
      { path: '/reviewer', label: 'AI Reviewer', icon: FiCpu, color: 'text-violet-400' },
      { path: '/flashcards', label: 'Flashcards', icon: FiLayers, color: 'text-cyan-400' },
      { path: '/quiz', label: 'Quiz', icon: FiHelpCircle, color: 'text-amber-400' },
      { path: '/crossword', label: 'Crossword', icon: FiGridIcon, color: 'text-blue-400' },
      { path: '/multiplayer', label: 'Multiplayer Quiz', icon: FiUsers, color: 'text-pink-400' },
    ],
  },
  {
    title: 'PRODUCTIVITY',
    items: [
      { path: '/pomodoro', label: 'Pomodoro', icon: FiClock, color: 'text-emerald-400' },
      { path: '/breaks', label: 'Smart Break', icon: FiCoffee, color: 'text-orange-400' },
    ],
  },
  {
    title: 'PROGRESS',
    items: [
      { path: '/history', label: 'History', icon: FiRefreshCw, color: 'text-teal-400' },
      { path: '/leaderboard', label: 'Leaderboard', icon: FiStar, color: 'text-yellow-400' },
    ],
  },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const sidebarWidth = collapsed ? 'w-20' : 'w-72';

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex-shrink-0 transform transition-all duration-300 ease-in-out lg:transform-none ${sidebarWidth} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col m-3 ml-0 rounded-3xl overflow-hidden glass-panel" style={{ boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.20)' }}>

          {/* ── Header: Logo + Branding ── */}
          <div className={`flex items-center gap-3 pt-5 ${collapsed ? 'px-3 justify-center' : 'px-5'} transition-all duration-300`}>
            <Link to="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                <img src="/stempal-logo-new.png" alt="STEMPal" className="w-full h-full object-cover" />
              </div>
              {!collapsed && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-xl font-bold gradient-text">STEMPal</h1>
                  <p className="text-[10px] text-[var(--text-secondary)] tracking-wide uppercase">Smart Study Platform</p>
                </div>
              )}
            </Link>
          </div>

          {/* ── Gemini AI Branding ── */}
          {!collapsed && (
            <div className="px-5 mt-1 mb-3 transition-opacity duration-300">
              <p className="text-[10px] text-[#60C5FF]/70 text-center tracking-wide">
                ✨ Powered by Google Gemini AI
              </p>
            </div>
          )}

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]/50 px-3 mb-2 select-none">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative ${
                          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                        } ${
                          active
                            ? 'bg-gradient-to-r from-[#60C5FF]/15 to-[#8EEBFF]/10 text-[var(--text-primary)] shadow-sm border border-[#60C5FF]/20'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60 hover:text-[var(--text-primary)]'
                        }`}>
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#60C5FF] to-[#8EEBFF]" />
                        )}
                        <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? item.color : ''}`} />
                        {!collapsed && (
                          <span className="font-medium text-sm transition-opacity duration-300">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* ── Collapse Toggle (Desktop) ── */}
          <div className={`hidden lg:flex border-t border-[var(--glass-border)] ${collapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 justify-end'}`}>
            <button onClick={() => setCollapsed(!collapsed)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60 hover:text-[var(--text-primary)] transition-all">
              {collapsed ? <FiMenu className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* ── Bottom: Profile Card + Logout ── */}
          <div className={`border-t border-[var(--glass-border)] ${collapsed ? 'p-3' : 'p-4'} transition-all duration-300`}>
            {/* Profile Card */}
            <div className={`flex items-center gap-3 rounded-xl hover:bg-[var(--bg-secondary)]/60 transition-all cursor-default mb-2 ${
              collapsed ? 'justify-center px-0 py-2' : 'px-2 py-2.5'
            }`}>
              <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 overflow-hidden">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.fullname?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1 transition-opacity duration-300">
                  <p className="text-sm font-medium truncate">{user?.fullname || 'Student'}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email || ''}</p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout}
              className={`w-full rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 font-medium ${
                collapsed ? 'justify-center p-2.5' : 'p-2.5 justify-center'
              }`}>
              <FiLogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
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
