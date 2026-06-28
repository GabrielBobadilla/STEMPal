import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const StatCard = ({ icon, value, label }) => (
  <motion.div variants={itemVariants} className="glass-card p-4 text-center hover:shadow-lg transition-shadow">
    <p className="text-2xl mb-2">{icon}</p>
    <p className="text-2xl font-bold gradient-text">{value}</p>
    <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
  </motion.div>
);

export default StatCard;
