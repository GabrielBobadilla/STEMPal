import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI, gamificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import ProfilePicture from '../components/profile/ProfilePicture';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import SettingsToggle from '../components/profile/SettingsToggle';
import LevelBadge from '../components/profile/LevelBadge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    fullname: '', email: '', phone: '',
    grade_level: '', school: '', stem_strand: ''
  });
  const [notifications, setNotifications] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [levelInfo, setLevelInfo] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        grade_level: user.grade_level || '',
        school: user.school || '',
        stem_strand: user.stem_strand || ''
      });
      setNotifications(user.notifications ?? true);
    }
  }, [user]);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const [levelRes, rankRes] = await Promise.all([
          gamificationAPI.getLevelInfo(),
          gamificationAPI.getRanking()
        ]);
        setLevelInfo(levelRes.data);
        setRanking(rankRes.data);
      } catch {}
    };
    fetchGamification();
  }, []);

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
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    }
  };

  const handleNotificationsToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    try {
      await userAPI.updateNotifications({ notifications: newVal });
    } catch {
      setNotifications(!newVal);
      toast.error('Failed to update notification settings');
    }
  };

  const level = levelInfo?.level || ranking?.level || 'Beginner';
  const streak = levelInfo?.current_streak || ranking?.current_streak || 0;
  const totalXp = levelInfo?.total_xp || ranking?.total_xp || 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ProfilePicture user={user} fullname={form.fullname} uploading={uploading} onUpload={handleUploadPicture} />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold">{form.fullname || 'Your Name'}</h1>
            <p className="text-[var(--text-secondary)]">{form.email}</p>
            <LevelBadge levelInfo={levelInfo} ranking={ranking} />
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400">
                {level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                🔥 {streak} day streak
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                ⚡ {totalXp} XP
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <PersonalInfoForm form={form} onChange={handleChange} onSave={handleSave} saving={saving} />
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
            <button onClick={toggleTheme} className="btn-secondary text-sm px-4 py-1.5">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <span>🚪</span>
              <span className="text-sm font-medium">Sign Out</span>
            </div>
            <button onClick={logout} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
