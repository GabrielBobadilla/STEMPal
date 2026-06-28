import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { flashcardAPI } from '../services/api';
import { toast } from 'react-toastify';
import FlashcardStats from '../components/flashcards/FlashcardStats';
import FilterBar from '../components/flashcards/FilterBar';
import FlashcardCard from '../components/flashcards/FlashcardCard';
import CreateManualModal from '../components/flashcards/CreateManualModal';
import EmptyState from '../components/common/EmptyState';

const COUNT_OPTIONS = [5, 10, 15, 20];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({ mastered: 0, learning: 0, toReview: 0 });
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [difficulty, setDifficulty] = useState(null);
  const [flippedId, setFlippedId] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const params = {};
      if (filter === 'favorites') params.favorites = true;
      if (filter === 'due') params.due = true;
      if (difficulty) params.difficulty = difficulty.toLowerCase();
      const res = await flashcardAPI.getAll(params);
      setCards(res.data || []);
    } catch {
      setCards([]);
    }
  }, [filter, difficulty]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await flashcardAPI.getStats();
      const s = res.data || {};
      setStats({
        mastered: s.mastered || 0,
        learning: s.learning || 0,
        toReview: s.toReview || 0
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, [fetchCards, fetchStats]);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setGenerating(true);
    try {
      await flashcardAPI.generate({ topic: topic.trim(), count });
      toast.success('Flashcards generated successfully');
      fetchCards();
      fetchStats();
    } catch {
      toast.error('Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await flashcardAPI.toggleFavorite(id);
      fetchCards();
      fetchStats();
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleReview = async (id, mastered) => {
    try {
      await flashcardAPI.review(id, { mastered });
      toast.success(mastered ? 'Marked as mastered' : 'Marked for review');
      fetchCards();
      fetchStats();
    } catch {
      toast.error('Failed to record review');
    }
  };

  const handleRefresh = () => {
    fetchCards();
    fetchStats();
    setShowManual(false);
  };

  const filteredCards = cards.filter((card) => {
    if (filter === 'favorites' && !card.is_favorite) return false;
    if (filter === 'due' && !card.due_for_review) return false;
    if (difficulty && card.difficulty !== difficulty.toLowerCase()) return false;
    return true;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Flashcards</h1>
        <p className="text-[var(--text-secondary)] mb-6">Create, review, and master flashcards for any STEM topic</p>

        <FlashcardStats stats={stats} />

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Photosynthesis, Quantum Mechanics)..."
                className="input-field"
              />
            </div>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="input-field w-full md:w-28"
            >
              {COUNT_OPTIONS.map((c) => (
                <option key={c} value={c}>{c} cards</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                'Generate Flashcards'
              )}
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="btn-secondary px-6"
            >
              Create Manual
            </button>
          </div>
        </div>
      </motion.div>

      <FilterBar
        filter={filter}
        difficulty={difficulty}
        onFilterChange={setFilter}
        onDifficultyChange={setDifficulty}
      />

      {filteredCards.length === 0 ? (
        <EmptyState
          icon="🎴"
          title="No flashcards found"
          subtitle={
            filter === 'all'
              ? 'Generate or create flashcards to get started'
              : 'Try changing your filters'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card, i) => (
            <FlashcardCard
              key={card.id || i}
              card={card}
              isFlipped={flippedId === card.id}
              onFlip={(id) => setFlippedId(id)}
              onToggleFavorite={handleToggleFavorite}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      <CreateManualModal
        show={showManual}
        onClose={() => setShowManual(false)}
        defaultTopic={topic}
        onCreate={handleRefresh}
      />
    </motion.div>
  );
};

export default Flashcards;
