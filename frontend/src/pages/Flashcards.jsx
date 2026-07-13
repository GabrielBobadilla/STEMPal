import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { flashcardAPI } from '../services/api';
import { toast } from 'react-toastify';

const COUNT_OPTIONS = [5, 10, 15, 20];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];
const FILTER_TABS = ['all', 'favorites', 'due'];

const filterLabel = { all: 'All', favorites: 'Favorites', due: 'Due for Review' };

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({ mastered: 0, learning: 0, toReview: 0 });
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [flippedId, setFlippedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '', difficulty: 'medium' });
  const [creating, setCreating] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const params = {};
      if (filter === 'favorites') params.favorites = true;
      if (filter === 'due') params.due = true;
      if (difficulty && difficulty !== 'all') params.difficulty = difficulty;
      const res = await flashcardAPI.getAll(params);
      setCards(res.data || []);
    } catch { setCards([]); }
  }, [filter, difficulty]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await flashcardAPI.getStats();
      const s = res.data || {};
      setStats({ mastered: s.mastered || 0, learning: s.learning || 0, toReview: s.toReview || 0 });
    } catch {}
  }, []);

  useEffect(() => { fetchCards(); fetchStats(); }, [fetchCards, fetchStats]);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setGenerating(true);
    try {
      await flashcardAPI.generate({ topic: topic.trim(), count });
      toast.success('Flashcards generated');
      fetchCards(); fetchStats();
    } catch { toast.error('Failed to generate flashcards'); } finally { setGenerating(false); }
  };

  const handleToggleFavorite = async (id) => {
    try { await flashcardAPI.toggleFavorite(id); fetchCards(); fetchStats(); } catch { toast.error('Failed to update'); }
  };

  const handleReview = async (id, mastered) => {
    try { await flashcardAPI.review(id, { mastered }); fetchCards(); fetchStats(); } catch { toast.error('Failed to record'); }
  };

  const handleCreate = async () => {
    if (!newCard.question || !newCard.answer) return toast.error('Please fill in question and answer');
    setCreating(true);
    try {
      await flashcardAPI.create({ ...newCard, topic: topic || 'General' });
      toast.success('Flashcard created');
      setShowCreate(false);
      setNewCard({ question: '', answer: '', difficulty: 'medium' });
      fetchCards(); fetchStats();
    } catch { toast.error('Failed to create'); } finally { setCreating(false); }
  };

  const filteredCards = cards.filter((card) => {
    if (filter === 'favorites' && !card.is_favorite) return false;
    if (filter === 'due' && !card.due_for_review) return false;
    if (difficulty !== 'all' && card.difficulty !== difficulty) return false;
    return true;
  });

  const diffColor = (d) => {
    if (d === 'easy') return 'bg-green-500/20 text-green-400';
    if (d === 'hard') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 px-4 sm:px-0">
      {/* ── Hero Section ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#60C5FF] to-[#0EA5E9] p-5 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">Flashcards</h1>
          <p className="text-white/70 text-sm sm:text-base mb-4 sm:mb-6">Create, review, and master flashcards</p>

          {/* ── Stats Panel ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:bg-white/10 sm:rounded-xl sm:p-1">
            {['mastered', 'learning', 'toReview'].map((k) => (
              <div key={k} className="bg-white/10 sm:bg-transparent rounded-xl px-2 py-2.5 sm:py-2 text-center">
                <p className="text-xl sm:text-2xl font-bold leading-tight">{stats[k] || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-white/60 capitalize leading-tight">
                  {k.replace('toReview', 'to review').replace(/([A-Z])/g, ' $1')}
                </p>
              </div>
            ))}
          </div>

          {/* ── Topic Input & Card Count ── */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Photosynthesis, Quantum Mechanics..."
              className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base" />
            <select value={count} onChange={e => setCount(Number(e.target.value))}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base">
              {COUNT_OPTIONS.map((c) => <option key={c} value={c} className="text-[var(--text-primary)]">{c} cards</option>)}
            </select>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={handleGenerate} disabled={generating || !topic.trim()}
              className="w-full sm:flex-1 py-3 rounded-xl bg-white text-sky-700 font-medium text-sm disabled:opacity-50 transition-all">
              {generating ? 'Generating...' : 'Generate Flashcards'}
            </button>
            <button onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all">
              + Create
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Filter Chips ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTER_TABS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                filter === f ? 'bg-sky-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>{filterLabel[f]}</button>
          ))}
          <span className="shrink-0 w-px bg-[var(--glass-border)] my-1" />
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap shrink-0 ${
                difficulty === d ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}>{d}</button>
          ))}
        </div>
      </motion.div>

      {/* ── Flashcard List / Empty State ── */}
      {filteredCards.length === 0 ? (
        <div className="glass-card p-10 sm:p-12 text-center mx-0 sm:mx-0">
          <p className="text-3xl sm:text-4xl mb-3">🎴</p>
          <p className="text-[var(--text-secondary)] font-medium">No flashcards found</p>
          <p className="text-sm text-[var(--text-secondary)]/60 mt-1">
            {filter === 'all' ? 'Generate or create flashcards to get started' : 'Try changing your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCards.map((card, i) => {
            const isFlipped = flippedId === card.id;
            return (
              <motion.div key={card.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="relative cursor-pointer" style={{ perspective: '1000px', minHeight: '240px' }}
                onClick={() => setFlippedId(isFlipped ? null : card.id)}>
                <div style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  className="absolute inset-0">
                  <div style={{ backfaceVisibility: 'hidden' }} className="glass-card p-4 sm:p-5 h-full flex flex-col border border-[var(--glass-border)]">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/20 text-sky-400 font-medium truncate max-w-[60%]">{card.topic}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(card.id); }}
                        className={`text-lg shrink-0 ${card.is_favorite ? 'text-red-400' : 'text-[var(--text-secondary)]'} hover:text-red-400 transition-colors`}>
                        {card.is_favorite ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-3 sm:py-4">
                      <p className="text-sm sm:text-base font-medium text-center leading-relaxed">{card.question}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--glass-border)]">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${diffColor(card.difficulty)}`}>{card.difficulty}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Tap to flip</span>
                    </div>
                  </div>
                </div>
                <div style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  className="absolute inset-0">
                  <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="glass-card p-4 sm:p-5 h-full flex flex-col border-2 border-sky-500/30">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs font-medium text-sky-400">Answer</span>
                      <button onClick={(e) => { e.stopPropagation(); setFlippedId(null); }}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-3 sm:py-4">
                      <p className="text-sm sm:text-base text-center leading-relaxed">{card.answer}</p>
                    </div>
                    <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--glass-border)]">
                      <button onClick={(e) => { e.stopPropagation(); handleReview(card.id, 'mastered'); }}
                        className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">Mastered</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReview(card.id, 'again'); }}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30 transition-colors">Review</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
          <div className="glass-card p-5 sm:p-6 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold gradient-text">Create Flashcard</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-lg">✕</button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <textarea value={newCard.question} onChange={e => setNewCard({ ...newCard, question: e.target.value })}
                rows={3} placeholder="Enter your question..." className="input-field w-full resize-none text-sm" />
              <textarea value={newCard.answer} onChange={e => setNewCard({ ...newCard, answer: e.target.value })}
                rows={3} placeholder="Enter the answer..." className="input-field w-full resize-none text-sm" />
              <div className="flex gap-2 sm:gap-3">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button key={d} onClick={() => setNewCard({ ...newCard, difficulty: d })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize ${
                      newCard.difficulty === d ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-white/20'
                    }`}>{d}</button>
                ))}
              </div>
              <button onClick={handleCreate} disabled={!newCard.question || !newCard.answer || creating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#60C5FF] to-[#38BDF8] text-white font-medium disabled:opacity-50 transition-all text-sm">
                {creating ? 'Creating...' : 'Create Flashcard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
