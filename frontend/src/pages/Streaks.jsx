import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { streakAPI, achievementAPI, gamificationAPI } from '../services/api';
import { toast } from 'react-toastify';
import StreakStats from '../components/streaks/StreakStats';
import WeeklyCalendar from '../components/streaks/WeeklyCalendar';
import MonthlyCalendar from '../components/streaks/MonthlyCalendar';
import AchievementBadge, { BADGE_TIERS } from '../components/streaks/AchievementBadge';
import LevelProgressBar from '../components/streaks/LevelProgressBar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Streaks = () => {
  const [streakData, setStreakData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeDays, setActiveDays] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [streakRes, achievementRes, levelRes] = await Promise.all([
        streakAPI.get().catch(() => ({ data: null })),
        achievementAPI.getAll().catch(() => ({ data: [] })),
        gamificationAPI.getLevelInfo().catch(() => ({ data: null }))
      ]);
      setStreakData(streakRes.data);
      setAchievements(achievementRes.data || []);
      setLevelInfo(levelRes.data);

      if (streakRes.data?.active_dates) {
        setActiveDays(streakRes.data.active_dates.map((d) => new Date(d).toDateString()));
      }
    } catch {}
  };

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;

  const navMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Streaks & Achievements</h1>
        <p className="text-[var(--text-secondary)]">Track your learning consistency</p>
      </motion.div>

      <StreakStats currentStreak={currentStreak} longestStreak={longestStreak} levelInfo={levelInfo} />

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold gradient-text mb-4">This Week</h2>
        <WeeklyCalendar activeDays={activeDays} />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <MonthlyCalendar currentMonth={currentMonth} currentYear={currentYear} activeDays={activeDays} onNavigate={navMonth} />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold gradient-text mb-4">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {BADGE_TIERS.map((tier, i) => (
            <AchievementBadge key={tier.key} tier={tier} achievements={achievements} currentStreak={currentStreak} index={i} />
          ))}
        </div>
      </motion.div>

      <LevelProgressBar levelInfo={levelInfo} />
    </motion.div>
  );
};

export default Streaks;
