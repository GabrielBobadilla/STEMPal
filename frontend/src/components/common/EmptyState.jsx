import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const EmptyState = ({ icon = '📋', title, subtitle }) => (
  <motion.div variants={itemVariants} className="glass-card p-12 text-center">
    <p className="text-4xl mb-4">{icon}</p>
    <p className="text-[var(--text-secondary)]">{title}</p>
    {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
  </motion.div>
);

export default EmptyState;
