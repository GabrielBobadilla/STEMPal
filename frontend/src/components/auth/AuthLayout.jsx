import React from 'react';
import { motion } from 'framer-motion';

const shapes = [
  {
    type: 'triangle',
    size: 80,
    initialX: '10%',
    initialY: '20%',
    duration: 8,
    delay: 0,
    rotate: 45,
    color: 'rgba(255,255,255,0.15)'
  },
  {
    type: 'square',
    size: 60,
    initialX: '85%',
    initialY: '15%',
    duration: 10,
    delay: 0.5,
    rotate: 30,
    color: 'rgba(255,255,255,0.12)'
  },
  {
    type: 'hexagon',
    size: 90,
    initialX: '75%',
    initialY: '70%',
    duration: 12,
    delay: 1,
    rotate: 60,
    color: 'rgba(255,255,255,0.1)'
  },
  {
    type: 'diamond',
    size: 50,
    initialX: '20%',
    initialY: '75%',
    duration: 9,
    delay: 0.8,
    rotate: 0,
    color: 'rgba(255,255,255,0.15)'
  },
  {
    type: 'triangle',
    size: 100,
    initialX: '50%',
    initialY: '10%',
    duration: 11,
    delay: 1.5,
    rotate: 90,
    color: 'rgba(255,255,255,0.08)'
  },
  {
    type: 'square',
    size: 70,
    initialX: '5%',
    initialY: '50%',
    duration: 7,
    delay: 0.3,
    rotate: 15,
    color: 'rgba(255,255,255,0.1)'
  },
  {
    type: 'diamond',
    size: 65,
    initialX: '90%',
    initialY: '45%',
    duration: 13,
    delay: 1.2,
    rotate: 45,
    color: 'rgba(255,255,255,0.08)'
  }
];

const ShapeComponent = ({ shape }) => {
  let clipPath;
  switch (shape.type) {
    case 'triangle':
      clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      break;
    case 'hexagon':
      clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
      break;
    case 'diamond':
      clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      break;
    default:
      clipPath = 'none';
  }

  return (
    <motion.div
      initial={{
        x: shape.initialX,
        y: shape.initialY,
        rotate: shape.rotate,
        opacity: 0
      }}
      animate={{
        x: [shape.initialX, `calc(${shape.initialX} + 80px)`, `calc(${shape.initialX} - 40px)`, shape.initialX],
        y: [shape.initialY, `calc(${shape.initialY} - 60px)`, `calc(${shape.initialY} + 80px)`, shape.initialY],
        rotate: [shape.rotate, shape.rotate + 180, shape.rotate + 360],
        opacity: [0, 0.8, 0.6, 0.8, 0]
      }}
      transition={{
        duration: shape.duration,
        delay: shape.delay,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className="absolute"
      style={{
        width: shape.size,
        height: shape.size,
        clipPath,
        background: shape.color,
        border: shape.type === 'square' ? '2px solid rgba(255,255,255,0.15)' : 'none',
        borderRadius: shape.type === 'square' ? '4px' : '0'
      }}
    />
  );
};

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
    {shapes.map((shape, i) => (
      <ShapeComponent key={i} shape={shape} />
    ))}
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.12 }}
      transition={{ duration: 1.5 }}
      className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }}
      transition={{ duration: 1.5, delay: 0.3 }}
      className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-sky-300 rounded-full" />
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }}
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
