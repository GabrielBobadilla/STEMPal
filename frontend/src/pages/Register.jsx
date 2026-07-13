import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 5);
};

const strengthConfig = {
  0: { label: '', color: 'bg-gray-200', width: '0%', text: '' },
  1: { label: 'Weak', color: 'bg-red-500', width: '20%', text: 'text-red-500' },
  2: { label: 'Fair', color: 'bg-orange-500', width: '40%', text: 'text-orange-500' },
  3: { label: 'Good', color: 'bg-yellow-500', width: '60%', text: 'text-yellow-500' },
  4: { label: 'Strong', color: 'bg-lime-500', width: '80%', text: 'text-lime-500' },
  5: { label: 'Very Strong', color: 'bg-green-500', width: '100%', text: 'text-green-500' },
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Register = () => {
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'email' && value) {
      setEmailError(isValidEmail(value) ? '' : 'Please enter a valid email address');
    } else if (field === 'email') {
      setEmailError('');
    }
    if (field === 'confirmPassword' || field === 'password') {
      const pw = field === 'password' ? value : form.password;
      const cp = field === 'confirmPassword' ? value : form.confirmPassword;
      if (cp && pw !== cp) {
        setConfirmError('Passwords do not match');
      } else {
        setConfirmError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullname, email, phone, password, confirmPassword } = form;

    if (!fullname || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({ fullname, email, phone, password });
      toast.success('Account created successfully!');
      navigate('/preferences');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);
  const strengthInfo = strengthConfig[strength];

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <img src="/stempal-logo-new.png" alt="STEMPal Logo" className="w-20 h-20 mx-auto mb-4 object-contain rounded-2xl" />
        <h1 className="text-3xl font-bold gradient-text">STEMPal</h1>
        <p className="text-[var(--text-secondary)] mt-1">Create your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={form.fullname} onChange={(e) => updateField('fullname', e.target.value)}
            placeholder="John Doe" className="input-field" autoComplete="name" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
            className={`input-field ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            autoComplete="email" required />
          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Phone (optional)</label>
          <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 234 567 8900" className="input-field" autoComplete="tel" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={(e) => updateField('password', e.target.value)} placeholder="Create a strong password"
              className="input-field pr-12" autoComplete="new-password" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" tabIndex={-1}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden" style={{ border: '1px solid var(--glass-border)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: strengthInfo.width }}
                  transition={{ duration: 0.3 }} className={`h-full rounded-full ${strengthInfo.color}`} />
              </div>
              {strength > 0 && (
                <p className={`text-xs mt-1 font-medium ${strengthInfo.text}`}>{strengthInfo.label}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Repeat your password"
              className={`input-field pr-12 ${confirmError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              autoComplete="new-password" required />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" tabIndex={-1}>
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {confirmError && <p className="text-red-500 text-xs mt-1">{confirmError}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          {loading && <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link to="/login"
          className="text-sky-600 hover:text-sky-700
dark:text-sky-400 dark:hover:text-sky-300 font-medium transition-colors">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
