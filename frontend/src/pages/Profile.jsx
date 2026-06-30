import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { userAPI, gamificationAPI, streakAPI, achievementAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const BADGE_TIERS = [
  { key: 'first_study', label: 'First Study', icon: '🌱', desc: 'Complete your first study session', xp: 50 },
  { key: 'streak_3', label: '3-Day Streak', icon: '🔥', desc: 'Study 3 days in a row', xp: 100 },
  { key: 'streak_7', label: 'Week Warrior', icon: '⚡', desc: 'Study 7 days in a row', xp: 200 },
  { key: 'streak_30', label: 'Monthly Master', icon: '💎', desc: 'Study 30 days in a row', xp: 500 },
  { key: 'quiz_perfect', label: 'Perfect Score', icon: '🎯', desc: 'Get 100% on a quiz', xp: 300 },
  { key: 'xp_1000', label: 'Century', icon: '⭐', desc: 'Earn 1000 XP', xp: 400 },
  { key: 'xp_5000', label: 'Powerhouse', icon: '🏆', desc: 'Earn 5000 XP', xp: 800 },
  { key: 'xp_5000', label: 'All-Rounder', icon: '🌟', desc: 'Use all study tools', xp: 600 },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullname: '', email: '', phone: '', bio: '',
    grade_level: '', school: '', stem_strand: ''
  });
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [levelInfo, setLevelInfo] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;
  const activeDates = streakData?.active_dates || [];

  const today = new Date();
  const weekDates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    weekDates.push(d);
  }
  const isActiveDay = (date) => activeDates.some(
    a => new Date(a).toDateString() === date.toDateString()
  );

  const weekProgress = Math.min(
    activeDates.filter(a => {
      const d = new Date(a);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length / 7 * 100, 100
  );

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
      setNotifications(user.notification_enabled ?? true);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data);
      toast.success('Profile updated');
      setEditing(false);
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
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Fill all password fields');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch { toast.error('Failed to change password'); }
  };

  const handleNotificationsToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    try { await userAPI.updateNotifications({ notifications: newVal }); } catch { setNotifications(!newVal); toast.error('Failed to update'); }
  };

  const xpProgress = levelInfo?.max_xp && levelInfo?.min_xp
    ? ((levelInfo.currentXp - levelInfo.min_xp) / (levelInfo.max_xp - levelInfo.min_xp)) * 100
    : 0;

  const metricList = metrics ? [
    { label: 'Study Time', value: `${metrics.total_study_time || 0}h`, icon: '⏰', color: 'from-sky-500 to-indigo-500' },
    { label: 'Avg Quiz', value: `${metrics.avg_quiz_score || 0}%`, icon: '📝', color: 'from-emerald-500 to-teal-500' },
    { label: 'Focus', value: `${metrics.focus_improvement || 0}%`, icon: '🎯', color: 'from-violet-500 to-purple-500' },
    { label: 'Engagement', value: `${metrics.engagement_rate || 0}%`, icon: '💪', color: 'from-amber-500 to-orange-500' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5 p-4">
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-500/5 to-transparent rounded-bl-full" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 p-0.5">
              <div className="w-full h-full rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                {user?.profile_picture && user.profile_picture !== 'default.png' ? (
                  <img src={`http://localhost:5000/uploads/profiles/${user.profile_picture}`}
                    alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-sky-400">
                    {form.fullname?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm hover:bg-sky-600 transition-all shadow-lg">
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadPicture} className="hidden" />
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input name="fullname" value={form.fullname} onChange={handleChange}
                  placeholder="Full Name" className="input-field text-lg font-bold" />
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={2}
                  placeholder="Write a short bio..." className="input-field w-full resize-none text-sm" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">{form.fullname || 'Your Name'}</h1>
                <p className="text-[var(--text-secondary)] text-sm">{form.email}</p>
                {form.bio && (
                  <p className="text-sm text-[var(--text-secondary)]/70 mt-2 italic max-w-md">{form.bio}</p>
                )}
              </>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/10">
                🔥 {currentStreak} day streak
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/10">
                ⚡ {levelInfo?.currentXp || user?.total_xp || 0} XP
              </span>
              {ranking && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/10">
                  🏅 #{ranking.ranking} Leaderboard
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                  {saving && <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />}
                  {saving ? 'Saving' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="btn-secondary text-sm px-4 py-2">Cancel</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5">
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {editing && (
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-sky-400 rounded-full" />
            Personal Information
          </h2>
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
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
                <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange}
                  readOnly={field.readOnly}
                  className={`input-field ${field.readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Level', value: levelInfo?.currentLevel || 1, icon: '🏅', sub: levelInfo?.nextLevelName || 'Next level', color: 'from-sky-500 to-cyan-500' },
          { label: 'XP', value: levelInfo?.currentXp || user?.total_xp || 0, icon: '⚡', sub: `${levelInfo?.nextLevelXp || 100} to next`, color: 'from-amber-500 to-yellow-500' },
          { label: 'Streak', value: `${currentStreak}d`, icon: '🔥', sub: `${longestStreak}d longest`, color: 'from-orange-500 to-red-500' },
          { label: 'Ranking', value: ranking ? `#${ranking.ranking}` : '--', icon: '🏆', sub: `${ranking?.total || 0} total users`, color: 'from-emerald-500 to-green-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center relative overflow-hidden group hover:shadow-lg transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${stat.color} opacity-[0.04] rounded-bl-full group-hover:opacity-[0.07] transition-opacity`} />
            <div className="relative">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{stat.sub}</div>
              <div className="text-xs text-[var(--text-secondary)]/50 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {levelInfo && (
        <motion.div variants={itemVariants} className="glass-card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Level Progress</span>
            <span className="text-xs text-[var(--text-secondary)]">{levelInfo.currentXp} / {levelInfo.maxXp} XP</span>
          </div>
          <div className="w-full h-2.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 transition-all duration-500"
              style={{ width: `${Math.min(xpProgress, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)]/50 mt-1">
            <span>{levelInfo.currentLevel || 'Lvl 1'}</span>
            <span>{levelInfo.nextLevelName || 'Next'}</span>
          </div>
        </motion.div>
      )}

      {metricList.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metricList.map((m, i) => (
              <div key={i} className="glass-card p-4 relative overflow-hidden group hover:shadow-lg transition-all">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${m.color} opacity-[0.04] rounded-bl-full`} />
                <div className="relative">
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="text-lg font-bold">{m.value}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-sky-400 rounded-full" />
          This Week
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((d, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-[var(--text-secondary)]/60 mb-1">
                {WEEKDAYS[i]}
              </div>
              <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                isActiveDay(d)
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : d.toDateString() === today.toDateString()
                    ? 'bg-[var(--bg-secondary)] ring-1 ring-sky-400/30'
                    : 'bg-[var(--bg-secondary)]'
              }`}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all"
              style={{ width: `${weekProgress}%` }} />
          </div>
          <span className="text-xs text-[var(--text-secondary)] shrink-0">
            {activeDates.filter(a => {
              const d = new Date(a);
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }).length}/7 days
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-sky-400 rounded-full" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGE_TIERS.map((tier, i) => {
            const unlocked = achievements.some(a => a.badge_key === tier.key || a.achievement_key === tier.key);
            return (
              <div key={i} className={`p-3 rounded-xl text-center transition-all ${
                unlocked
                  ? 'bg-gradient-to-b from-sky-500/10 to-indigo-500/5 border border-sky-500/20'
                  : 'bg-[var(--bg-secondary)] opacity-50'
              }`}>
                <div className={`text-2xl mb-1 ${unlocked ? '' : 'grayscale'}`}>{tier.icon}</div>
                <div className="text-xs font-semibold">{tier.label}</div>
                <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">{tier.desc}</div>
                {unlocked && <div className="text-[10px] text-sky-400 mt-1">✓ +{tier.xp} XP</div>}
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-sky-400 rounded-full" />
          Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Dark Mode', desc: 'Toggle between light and dark theme', enabled: darkMode, action: toggleTheme, icon: darkMode ? '🌙' : '☀️' },
            { label: 'Notifications', desc: 'Receive study reminders and updates', enabled: notifications, action: handleNotificationsToggle, icon: '🔔' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
                </div>
              </div>
              <button onClick={item.action}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  item.enabled ? 'bg-sky-500' : 'bg-white/20'
                }`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  item.enabled ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-sky-400 rounded-full" />
            Security
          </h3>
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-xs text-sky-400 hover:text-sky-300 transition-all">
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {[
              { label: 'Current Password', name: 'currentPassword', type: 'password' },
              { label: 'New Password', name: 'newPassword', type: 'password' },
              { label: 'Confirm Password', name: 'confirmPassword', type: 'password' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{f.label}</label>
                <input type={f.type} value={passwordData[f.name]} onChange={e =>
                  setPasswordData(p => ({ ...p, [f.name]: e.target.value }))}
                  className="input-field w-full" />
              </div>
            ))}
            <button type="submit" className="btn-primary text-sm px-6 py-2">Update Password</button>
          </form>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-sky-400 rounded-full" />
          Account
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <span className="text-lg">{darkMode ? '🌙' : '☀️'}</span>
              <span className="text-sm font-medium">Theme</span>
            </div>
            <button onClick={toggleTheme}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-all">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <span className="text-lg">🚪</span>
              <div>
                <div className="text-sm font-medium">Sign Out</div>
                <div className="text-xs text-[var(--text-secondary)]">Logout of your account</div>
              </div>
            </div>
            <button onClick={logout}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
