import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const MetricCard = ({ icon, value, label, sub }) => (
  <motion.div variants={itemVariants} className="glass-card p-4 text-center hover:shadow-lg transition-shadow">
    <p className="text-2xl mb-2">{icon}</p>
    <p className="text-xl font-bold gradient-text">{value}</p>
    <p className="text-[10px] text-[var(--text-secondary)] mt-1">{label}</p>
    <p className="text-[9px] text-[var(--text-secondary)] opacity-70">{sub}</p>
  </motion.div>
);

export default MetricCard;
