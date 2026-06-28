import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const QuickLink = ({ path, label, icon, color, desc }) => (
  <Link to={path}>
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="glass-card p-4 group cursor-pointer">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{label}</h3>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{desc}</p>
    </motion.div>
  </Link>
);

export default QuickLink;
