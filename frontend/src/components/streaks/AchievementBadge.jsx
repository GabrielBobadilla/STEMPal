import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const BADGE_TIERS = [
  { key: 'bronze', label: 'Bronze', days: 3, icon: '🥉', color: 'from-amber-600 to-amber-400' },
  { key: 'silver', label: 'Silver', days: 7, icon: '🥈', color: 'from-gray-400 to-gray-300' },
  { key: 'gold', label: 'Gold', days: 14, icon: '🥇', color: 'from-yellow-500 to-yellow-300' },
  { key: 'platinum', label: 'Platinum', days: 30, icon: '💎', color: 'from-cyan-500 to-sky-400' },
  { key: 'master', label: 'Master', days: 100, icon: '👑', color: 'from-purple-500 to-pink-400' }
];

const getAchievementStatus = (tier, achievements, currentStreak) => {
  const unlocked = achievements.find(
    (a) => a.name?.toLowerCase().includes(tier.label.toLowerCase()) || a.tier?.toLowerCase() === tier.key
  );
  if (unlocked) {
    return { unlocked: true, name: unlocked.name || tier.label, date: unlocked.unlocked_at || unlocked.created_at || null, icon: unlocked.icon || tier.icon };
  }
  const earnedByStreak = currentStreak >= tier.days;
  if (earnedByStreak) return { unlocked: true, name: tier.label, date: null, icon: tier.icon };
  return { unlocked: false, progress: Math.min(100, (currentStreak / tier.days) * 100) };
};

const AchievementBadge = ({ tier, achievements, currentStreak, index }) => {
  const status = getAchievementStatus(tier, achievements, currentStreak);
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }}
      className={`glass-card p-4 text-center transition-all duration-300 ${!status.unlocked ? 'opacity-40 grayscale' : ''}`}
    >
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl block mb-2">{status.icon}</motion.span>
      <h3 className="font-semibold text-sm">{tier.label}</h3>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{tier.days} day streak</p>
      {status.unlocked ? (
        <div className="mt-2 space-y-1">
          <span className="badge-success text-[10px]">Unlocked</span>
          {status.date && <p className="text-[10px] text-[var(--text-secondary)]">{new Date(status.date).toLocaleDateString()}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="h-full rounded-full gradient-bg" />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)]">{Math.floor(status.progress)}% complete</p>
        </div>
      )}
    </motion.div>
  );
};

export { BADGE_TIERS };
export default AchievementBadge;
