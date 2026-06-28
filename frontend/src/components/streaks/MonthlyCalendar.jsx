import React from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

const MonthlyCalendar = ({ currentMonth, currentYear, activeDays, onNavigate }) => {
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const today = new Date();
  const isDayActive = (day, month, year) => activeDays.includes(new Date(year, month, day).toDateString());

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const active = isDayActive(day, currentMonth, currentYear);
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    days.push(
      <motion.div key={day} whileHover={{ scale: 1.2 }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 ${
          active ? 'gradient-bg text-white shadow-md' : isToday ? 'border-2 border-purple-400 text-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
        }`}
      >
        {day}
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold gradient-text">{MONTHS[currentMonth]} {currentYear}</h2>
        <div className="flex gap-2">
          <button onClick={() => onNavigate(-1)}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm hover:text-purple-500 transition-colors">←</button>
          <button onClick={() => onNavigate(1)}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm hover:text-purple-500 transition-colors">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-[var(--text-secondary)] font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
};

export default MonthlyCalendar;
