import React from 'react';
import { motion } from 'framer-motion';

const shapes = [
  { type: 'triangle', size: 80, x: '10%', y: '20%', dur: 8, delay: 0, rot: 45 },
  { type: 'square', size: 60, x: '85%', y: '15%', dur: 10, delay: 0.5, rot: 30 },
  { type: 'hexagon', size: 90, x: '75%', y: '70%', dur: 12, delay: 1, rot: 60 },
  { type: 'diamond', size: 50, x: '20%', y: '75%', dur: 9, delay: 0.8, rot: 0 },
  { type: 'triangle', size: 100, x: '50%', y: '5%', dur: 11, delay: 1.5, rot: 90 },
  { type: 'square', size: 70, x: '5%', y: '45%', dur: 7, delay: 0.3, rot: 15 },
  { type: 'diamond', size: 65, x: '90%', y: '50%', dur: 13, delay: 1.2, rot: 45 },
  { type: 'hexagon', size: 40, x: '35%', y: '80%', dur: 14, delay: 0.7, rot: 20 },
  { type: 'triangle', size: 55, x: '60%', y: '85%', dur: 8, delay: 2, rot: 120 },
  { type: 'diamond', size: 35, x: '40%', y: '10%', dur: 15, delay: 0.4, rot: 60 },
  { type: 'square', size: 45, x: '70%', y: '40%', dur: 10, delay: 1.8, rot: 80 },
  { type: 'triangle', size: 30, x: '25%', y: '35%', dur: 6, delay: 2.2, rot: 10 },
];

const particles = Array.from({ length: 30 }, (_, i) => ({
  size: Math.random() * 4 + 2,
  x: `${Math.random() * 100}%`,
  dur: Math.random() * 8 + 6,
  delay: Math.random() * 5,
}));

const lines = [
  { x1: 0, y1: 30, x2: 25, y2: 10, delay: 0 },
  { x1: 75, y1: 0, x2: 100, y2: 20, delay: 1 },
  { x1: 0, y1: 70, x2: 30, y2: 60, delay: 2 },
  { x1: 70, y1: 80, x2: 100, y2: 65, delay: 1.5 },
  { x1: 10, y1: 0, x2: 15, y2: 30, delay: 0.5 },
  { x1: 80, y1: 30, x2: 95, y2: 50, delay: 2.5 },
];

function getClipPath(type) {
  switch (type) {
    case 'triangle': return 'polygon(50% 0%,0% 100%,100% 100%)';
    case 'hexagon': return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    case 'diamond': return 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)';
    default: return 'none';
  }
}

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>

    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
      {lines.map((l, i) => (
        <motion.line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 6, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </svg>

    {shapes.map((s, i) => (
      <motion.div key={i} className="absolute"
        style={{ width: s.size, height: s.size, clipPath: getClipPath(s.type),
          background: `rgba(255,255,255,${0.06 + Math.random() * 0.08})`,
          border: s.type === 'square' ? '1px solid rgba(255,255,255,0.12)' : 'none',
          borderRadius: s.type === 'square' ? '4px' : '0' }}
        initial={{ x: s.x, y: s.y, rotate: s.rot, opacity: 0, scale: 0.5 }}
        animate={{
          x: [s.x, `calc(${s.x} + ${60 + i * 10}px)`, `calc(${s.x} - ${30 + i * 5}px)`, s.x],
          y: [s.y, `calc(${s.y} - ${50 + i * 8}px)`, `calc(${s.y} + ${70 + i * 6}px)`, s.y],
          rotate: [s.rot, s.rot + 180, s.rot + 360],
          opacity: [0, 0.5 - i * 0.02, 0.3, 0.5 - i * 0.02, 0],
          scale: [0.5, 1, 0.8, 1, 0.5],
        }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }} />
    ))}

    {particles.map((p, i) => (
      <motion.div key={`p${i}`} className="absolute rounded-full bg-white"
        style={{ width: p.size, height: p.size, left: p.x }}
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: ['110%', '-10%'], opacity: [0, 0.3 - i * 0.008, 0] }}
        transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }} />
    ))}

    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }}
      transition={{ duration: 1.5 }}
      className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }}
      transition={{ duration: 1.5, delay: 0.3 }}
      className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-sky-300 rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.06 }}
      transition={{ duration: 1.5, delay: 0.6 }}
      className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-200 rounded-full" />

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
