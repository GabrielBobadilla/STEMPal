import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ChartCard = ({ title, children }) => (
  <motion.div variants={itemVariants} className="glass-card p-5">
    <h3 className="text-sm font-semibold mb-3">{title}</h3>
    <div className="h-64">{children}</div>
  </motion.div>
);

export default ChartCard;
