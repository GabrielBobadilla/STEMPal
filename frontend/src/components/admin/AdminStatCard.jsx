import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminStatCard = ({ icon, value, label, color }) => (
  <motion.div variants={itemVariants} className="glass-card p-4 text-center hover:shadow-lg transition-shadow">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl mx-auto mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-bold gradient-text">{value}</p>
    <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
  </motion.div>
);

export default AdminStatCard;
