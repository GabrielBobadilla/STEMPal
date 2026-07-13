import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Preferences from './pages/Preferences';
import Reviewer from './pages/Reviewer';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Pomodoro from './pages/Pomodoro';
import BreakPage from './pages/BreakPage';
import Crossword from './pages/Crossword';
import Multiplayer from './pages/Multiplayer';
import Profile from './pages/Profile';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #D6EEFF 70%, #CFEFFF 100%)' }}>
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #D6EEFF 70%, #CFEFFF 100%)' }}>
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Loading...</p>
      </div>
    </div>
  );
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #D6EEFF 70%, #CFEFFF 100%)' }}>
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Loading...</p>
      </div>
    </div>
  );
  return user ? <Navigate to="/dashboard" /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reviewer" element={<Reviewer />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-results" element={<QuizResults />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/crossword" element={<Crossword />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/breaks" element={<BreakPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen text-[var(--text-primary)] transition-colors duration-300 relative">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="stem-deco-blob w-[600px] h-[600px] bg-blue-400/[0.22] top-[-10%] left-[-5%] animate-drift" />
              <div className="stem-deco-blob w-[500px] h-[500px] bg-sky-400/[0.18] top-[30%] right-[-8%] animate-drift" style={{ animationDelay: '-7s' }} />
              <div className="stem-deco-blob w-[450px] h-[450px] bg-cyan-400/[0.16] bottom-[-5%] left-[20%] animate-drift" style={{ animationDelay: '-14s' }} />
              <div className="stem-deco-circle w-[300px] h-[300px] border-2 border-blue-400/[0.18] top-[15%] left-[60%] animate-float-slow" />
              <div className="stem-deco-circle w-[200px] h-[200px] border-2 border-sky-300/[0.15] top-[60%] left-[10%] animate-float-reverse" />
              <div className="stem-deco-circle w-[150px] h-[150px] border-2 border-cyan-300/[0.18] bottom-[20%] right-[25%] animate-float" />
              <svg className="stem-deco w-24 h-24 top-[10%] left-[5%] animate-float-slow" style={{ opacity: 0.09 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <svg className="stem-deco w-16 h-16 bottom-[15%] right-[8%] animate-float-reverse" style={{ opacity: 0.08 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <svg className="stem-deco w-20 h-20 top-[45%] right-[3%] animate-float" style={{ opacity: 0.09 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/>
              </svg>
              <svg className="stem-deco w-14 h-14 top-[70%] left-[40%] animate-float-slow" style={{ opacity: 0.08, animationDelay: '-4s' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              <div className="stem-deco w-[1px] h-40 bg-gradient-to-b from-transparent via-blue-300/20 to-transparent top-[20%] left-[35%] rotate-45" />
              <div className="stem-deco w-[1px] h-32 bg-gradient-to-b from-transparent via-sky-300/15 to-transparent top-[50%] right-[40%] -rotate-30" />
              <div className="stem-deco w-[1px] h-36 bg-gradient-to-b from-transparent via-cyan-300/15 to-transparent bottom-[10%] left-[55%] rotate-12" />
            </div>
            <div className="relative z-10">
              <AppRoutes />
            </div>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
