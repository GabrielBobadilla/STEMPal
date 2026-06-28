import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const quotes = [
  "The secret of getting ahead is getting started.",
  "Education is the most powerful weapon.",
  "Study hard, dream big.",
  "Success is the sum of small efforts repeated daily.",
  "Your attitude determines your direction.",
  "Knowledge is power.",
  "The expert in anything was once a beginner.",
  "Don't watch the clock; do what it does. Keep going.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Strive for progress, not perfection."
];

const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const WelcomeHeader = () => {
  const [time, setTime] = useState(new Date());
  const [quote] = useState(getRandomQuote);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div variants={itemVariants} className="glass-card p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Welcome back! 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' | '}
            {time.toLocaleTimeString()}
          </p>
        </div>
        <div className="glass px-4 py-2 rounded-xl text-center">
          <p className="text-sm text-[var(--text-secondary)]">Today's Motivation</p>
          <p className="text-sm font-medium italic">{quote}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHeader;
