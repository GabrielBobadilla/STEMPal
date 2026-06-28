import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset link. Please try again.';
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
        <p className="text-[var(--text-secondary)] mt-1">Reset your password</p>
      </div>

      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }} className="text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Check Your Email</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            We&apos;ve sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>.
            Please check your inbox and follow the instructions.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center justify-center px-8">Back to Login</Link>
        </motion.div>
      ) : (
        <>
          <p className="text-[var(--text-secondary)] text-sm mb-6 text-center">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" className="input-field" autoComplete="email" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading && <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            Remember your password?{' '}
            <Link to="/login"
              className="text-blue-600 hover:text-blue-700
dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
