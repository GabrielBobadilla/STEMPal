import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI, gamificationAPI, streakAPI, achievementAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import ProfilePicture from '../components/profile/ProfilePicture';
import LevelBadge from '../components/profile/LevelBadge';
import StreakStats from '../components/streaks/StreakStats';
import WeeklyCalendar from '../components/streaks/WeeklyCalendar';
import MonthlyCalendar from '../components/streaks/MonthlyCalendar';
import AchievementBadge, { BADGE_TIERS } from '../components/streaks/AchievementBadge';
import MetricCard from '../components/analytics/MetricCard';
import SettingsToggle from '../components/profile/SettingsToggle';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    fullname: '', email: '', phone: '', bio: '',
    grade_level: '', school: '', stem_strand: ''
  });
  const [notifications, setNotifications] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [levelInfo, setLevelInfo] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeDays, setActiveDays] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        grade_level: user.grade_level || '',
        school: user.school || '',
        stem_strand: user.stem_strand || ''
      });
      setNotifications(user.notifications ?? true);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelRes, rankRes, streakRes, achievementRes, metricsRes] = await Promise.all([
          gamificationAPI.getLevelInfo().catch(() => ({ data: null })),
          gamificationAPI.getRanking().catch(() => ({ data: null })),
          streakAPI.get().catch(() => ({ data: null })),
          achievementAPI.getAll().catch(() => ({ data: [] })),
          analyticsAPI.getMetrics().catch(() => ({ data: null }))
        ]);
        setLevelInfo(levelRes.data);
        setRanking(rankRes.data);
        setStreakData(streakRes.data);
        setAchievements(achievementRes.data || []);
        setMetrics(metricsRes.data);
        if (streakRes.data?.active_dates) {
          setActiveDays(streakRes.data.active_dates.map(d => new Date(d).toDateString()));
        }
      } catch {}
    };
    fetchData();
  }, []);

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;

  const navMonth = (dir) => {
    let m = currentMonth + dir, y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m); setCurrentYear(y);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profile_picture', file);
      const res = await userAPI.uploadProfilePicture(fd);
      updateUser(res.data);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Please fill in all password fields');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Failed to change password'); }
  };

  const handleNotificationsToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    try { await userAPI.updateNotifications({ notifications: newVal }); } catch { setNotifications(!newVal); toast.error('Failed to update'); }
  };

  const metricCards = metrics ? [
    { label: 'Total Study Time', value: `${metrics.total_study_time || 0}h`, icon: '⏰', sub: `${metrics.this_period_study_time || 0}h this period` },
    { label: 'Avg Quiz Score', value: `${metrics.avg_quiz_score || 0}%`, icon: '📝', sub: `${metrics.quizzes_taken || 0} quizzes taken` },
    { label: 'Focus Improvement', value: `${metrics.focus_improvement || 0}%`, icon: '🎯', sub: `${metrics.sessions_focused || 0} focused sessions` },
    { label: 'Engagement', value: `${metrics.engagement_rate || 0}%`, icon: '💪', sub: `${metrics.active_days || 0} active days` }
  ] : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ProfilePicture user={user} fullname={form.fullname} uploading={uploading} onUpload={handleUploadPicture} />
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{form.fullname || 'Your Name'}</h1>
            <p className="text-[var(--text-secondary)]">{form.email}</p>
            {form.bio && <p className="text-sm text-[var(--text-secondary)]/70 mt-2 italic">{form.bio}</p>}
            <LevelBadge levelInfo={levelInfo} ranking={ranking} />
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/20 text-amber-400">🔥 {currentStreak} day streak</span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-500/20 text-sky-400">⚡ {levelInfo?.total_xp || 0} XP</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', name: 'fullname', type: 'text' },
            { label: 'Email', name: 'email', type: 'email', readOnly: true },
            { label: 'Phone', name: 'phone', type: 'tel' },
            { label: 'Grade Level', name: 'grade_level', type: 'text' },
            { label: 'School', name: 'school', type: 'text' },
            { label: 'STEM Strand', name: 'stem_strand', type: 'text' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
              <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange}
                readOnly={field.readOnly}
                className={`input-field ${field.readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
              placeholder="Tell us about yourself..."
              className="input-field w-full resize-none" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
          {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Streaks & Stats</h2>
        <StreakStats currentStreak={currentStreak} longestStreak={longestStreak} levelInfo={levelInfo} />
      </motion.div>

      {metricCards.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((m, i) => <MetricCard key={i} icon={m.icon} value={m.value} label={m.label} sub={m.sub} />)}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="glass-card p-6">
        <WeeklyCalendar activeDays={activeDays} />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <MonthlyCalendar currentMonth={currentMonth} currentYear={currentYear} activeDays={activeDays} onNavigate={navMonth} />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {BADGE_TIERS.map((tier, i) => (
            <AchievementBadge key={tier.key} tier={tier} achievements={achievements} currentStreak={currentStreak} index={i} />
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-6">Preferences</h2>
        <div className="space-y-4">
          <SettingsToggle label="Dark Mode" description="Toggle between light and dark theme" enabled={darkMode} onChange={toggleTheme} />
          <SettingsToggle label="Notifications" description="Receive study reminders and updates" enabled={notifications} onChange={handleNotificationsToggle} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <PasswordChangeForm passwordData={passwordData} onChange={setPasswordData} onSubmit={handlePasswordChange} />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <span>{darkMode ? '🌙' : '☀️'}</span>
              <span className="text-sm font-medium">Theme</span>
            </div>
            <button onClick={toggleTheme} className="btn-secondary text-sm px-4 py-1.5">{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <span>🚪</span>
              <span className="text-sm font-medium">Sign Out</span>
            </div>
            <button onClick={logout} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Logout</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;