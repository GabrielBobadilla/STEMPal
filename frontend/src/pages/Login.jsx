import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { preferenceAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const res = await preferenceAPI.check();
      if (res.data.hasPreferences) {
        navigate('/dashboard');
      } else {
        navigate('/preferences');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Cannot connect to server. Make sure the backend is running.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <img src="/stempal-logo.jpg" alt="STEMPal Logo" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-3xl font-bold gradient-text">STEMPal</h1>
        <p className="text-[var(--text-secondary)] mt-1">Welcome back! Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email" className="input-field" autoComplete="email" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              className="input-field pr-12" autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" tabIndex={-1}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600
              focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm text-[var(--text-secondary)]">Remember Me</span>
          </label>
          <Link to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700
dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          {loading && <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link to="/register"
          className="text-blue-600 hover:text-blue-700
dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
