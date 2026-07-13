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

const particles = Array.from({ length: 40 }, (_, i) => ({
  size: Math.random() * 6 + 3,
  x: `${Math.random() * 100}%`,
  dur: Math.random() * 6 + 4,
  delay: Math.random() * 4,
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
    style={{ background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 25%, #60A5FA 50%, #7C3AED 75%, #BFDBFE 100%)' }}>

    <div className="absolute inset-0">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-white/[0.08] -top-40 -right-40 animate-drift" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-sky-300/[0.12] -bottom-40 -left-40 animate-drift" style={{ animationDelay: '-7s' }} />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-200/[0.08] top-1/3 left-1/2 -translate-x-1/2 animate-drift" style={{ animationDelay: '-14s' }} />
    </div>

    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
      {lines.map((l, i) => (
        <motion.line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke="white" strokeWidth="2" strokeLinecap="round" filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 5, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>

    {shapes.map((s, i) => (
      <motion.div key={i} className="absolute"
        style={{
          width: s.size, height: s.size,
          clipPath: getClipPath(s.type),
          background: `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.12))`,
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: s.type === 'square' ? '6px' : '0',
          boxShadow: '0 0 20px rgba(255,255,255,0.12)',
        }}
        initial={{ x: s.x, y: s.y, rotate: s.rot, opacity: 0, scale: 0.3 }}
        animate={{
          x: [s.x, `calc(${s.x} + ${120 + i * 15}px)`, `calc(${s.x} - ${80 + i * 8}px)`, s.x],
          y: [s.y, `calc(${s.y} - ${100 + i * 12}px)`, `calc(${s.y} + ${130 + i * 10}px)`, s.y],
          rotate: [s.rot, s.rot + 360, s.rot + 720],
          opacity: [0, 0.8, 0.4, 0.8, 0],
          scale: [0.3, 1.1, 0.7, 1.1, 0.3],
        }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }} />
    ))}

    {particles.map((p, i) => (
      <motion.div key={`p${i}`} className="absolute rounded-full"
        style={{
          width: p.size, height: p.size, left: p.x,
          background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(255,255,255,0.15))',
          boxShadow: '0 0 6px rgba(255,255,255,0.3)',
        }}
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: ['110%', '-10%'], opacity: [0, 0.5, 0] }}
        transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }} />
    ))}

    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md relative z-10">
      <div className="glass-modal p-6 sm:p-8 md:p-10">
        {children}
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
