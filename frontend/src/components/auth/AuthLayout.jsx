import React from 'react';
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.12 }}
      transition={{ duration: 1.5 }}
      className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }}
      transition={{ duration: 1.5, delay: 0.3 }}
      className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-blue-300 rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }}
      transition={{ duration: 1.5, delay: 0.6 }}
      className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-300 rounded-full" />
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md relative z-10">
      <div className="glass-card p-6 sm:p-8 md:p-10">
        {children}
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
