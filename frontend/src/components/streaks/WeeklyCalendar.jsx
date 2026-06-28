import React from 'react';
import { motion } from 'framer-motion';

const WeeklyCalendar = ({ activeDays }) => {
  const getWeeklyDays = () => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const weeklyDays = getWeeklyDays();

  return (
    <div className="flex items-center justify-between gap-2">
      {weeklyDays.map((day, i) => {
        const active = activeDays.includes(day.toDateString());
        const isToday = day.toDateString() === new Date().toDateString();
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">
              {day.toLocaleDateString('en', { weekday: 'short' })}
            </span>
            <motion.div whileHover={{ scale: 1.15 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200 ${
                active ? 'gradient-bg text-white shadow-md' : isToday ? 'border-2 border-purple-400' : 'bg-[var(--bg-secondary)]'
              }`}
            >
              {active ? '🔥' : '○'}
            </motion.div>
            <span className="text-[10px] text-[var(--text-secondary)]">{day.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyCalendar;
