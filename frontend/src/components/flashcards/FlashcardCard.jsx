import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiStar, FiRotateCw } from 'react-icons/fi';

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const FlashcardCard = ({ card, isFlipped, onFlip, onToggleFavorite, onReview }) => (
  <div className="perspective-1000" style={{ perspective: '1000px' }}>
    <motion.div
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      className="relative w-full cursor-pointer"
      style={{ minHeight: '250px', transformStyle: 'preserve-3d' }}
      onClick={!isFlipped ? () => onFlip(card.id) : undefined}
    >
      {/* Front */}
      <div className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : 'visible'}`} style={{ backfaceVisibility: 'hidden' }}>
        <div className="glass-card p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs px-2 py-1 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 capitalize">
              {card.topic}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(card.id); }}
              className={`p-2 rounded-lg transition-colors ${card.is_favorite ? 'text-red-400' : 'text-[var(--text-secondary)] hover:text-red-400'}`}
            >
              <FiHeart className={`w-5 h-5 ${card.is_favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg font-medium text-center">{card.question}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-xs px-2 py-1 rounded-lg border capitalize ${difficultyColors[card.difficulty] || difficultyColors.medium}`}>
              {card.difficulty}
            </span>
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
              <FiRotateCw className="w-3 h-3" /> Click to flip
            </span>
          </div>
        </div>
      </div>

      {/* Back */}
      <div className={`absolute inset-0 backface-hidden ${!isFlipped ? 'invisible' : 'visible'}`}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
        <div className="glass-card p-6 h-full flex flex-col border-primary-500/30 border-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-primary-400 flex items-center gap-1">
              <FiStar className="w-3 h-3" /> Answer
            </span>
            <span className="text-xs text-[var(--text-secondary)]">#{card.id}</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-center">{card.answer}</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onReview(card.id, 'mastered')}
              className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              Mastered
            </button>
            <button
              onClick={() => onReview(card.id, 'again')}
              className="flex-1 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
            >
              Review Again
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

export default FlashcardCard;
