import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { reviewerAPI, flashcardAPI, quizAPI } from '../services/api';
import { toast } from 'react-toastify';
import SectionCard from '../components/reviewer/SectionCard';
import QuizTimer from '../components/quiz/QuizTimer';

const TABS = [
  { key: 'reviewer', label: 'Reviewer', icon: '🤖' },
  { key: 'flashcards', label: 'Flashcards', icon: '🎴' },
  { key: 'quiz', label: 'Quiz', icon: '🧠' },
];

const TOPIC_SUGGESTIONS = [
  { label: "Newton's Laws", icon: '⚛️' },
  { label: 'Photosynthesis', icon: '🌿' },
  { label: 'Calculus', icon: '∫' },
  { label: 'DNA Structure', icon: '🧬' },
  { label: 'Thermodynamics', icon: '🔥' },
  { label: 'Linear Algebra', icon: '⬡' },
];

const REVIEW_TYPES = [
  { value: 'basic', label: 'Basic', icon: '📋', desc: 'Quick summary & key points', color: 'from-sky-400 to-blue-500' },
  { value: 'detailed', label: 'Detailed', icon: '📚', desc: 'In-depth comprehensive review', color: 'from-violet-400 to-purple-600' },
  { value: 'exam', label: 'Exam', icon: '🎯', desc: 'Exam-focused with practice', color: 'from-amber-400 to-orange-600' },
];

const SECTION_DEFS = [
  { title: 'Summary', key: 'summary', icon: '📝' },
  { title: 'Key Concepts', key: 'key_concepts', icon: '💡' },
  { title: 'Definitions', key: 'definitions', icon: '📖' },
  { title: 'Important Definitions', key: 'important_definitions', icon: '📖' },
  { title: 'Formula Sheet', key: 'formula_sheet', icon: '📐' },
  { title: 'Formulas', key: 'formulas', icon: '📐' },
  { title: 'Practice Questions', key: 'practice_questions', icon: '✍️' },
  { title: 'Key Formulas', key: 'key_formulas', icon: '📐' },
  { title: 'Common Mistakes', key: 'common_mistakes', icon: '⚠️' },
  { title: 'Detailed Explanations', key: 'detailed_explanations', icon: '🔬' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];
const FILTER_TABS = ['all', 'favorites', 'due'];
const CATEGORIES = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'computer_science', label: 'Computer Science' },
];
const QUIZ_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'identification', label: 'Identification' },
  { value: 'true_false', label: 'True or False' },
  { value: 'mixed', label: 'Mixed' },
];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const AIStudyHub = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('reviewer');
  const [topic, setTopic] = useState('');

  // Reviewer state
  const [reviewType, setReviewType] = useState('basic');
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Flashcards state
  const [fcCount, setFcCount] = useState(10);
  const [fcCards, setFcCards] = useState([]);
  const [fcStats, setFcStats] = useState({ mastered: 0, learning: 0, toReview: 0 });
  const [fcFilter, setFcFilter] = useState('all');
  const [fcDifficulty, setFcDifficulty] = useState('all');
  const [fcFlippedId, setFcFlippedId] = useState(null);
  const [fcGenerating, setFcGenerating] = useState(false);
  const [fcShowCreate, setFcShowCreate] = useState(false);
  const [fcNewCard, setFcNewCard] = useState({ question: '', answer: '', difficulty: 'medium' });
  const [fcCreating, setFcCreating] = useState(false);

  // Quiz state
  const [qzCategory, setQzCategory] = useState('mathematics');
  const [qzType, setQzType] = useState('mixed');
  const [qzDifficulty, setQzDifficulty] = useState('medium');
  const [qzCount, setQzCount] = useState(10);
  const [qzQuestions, setQzQuestions] = useState([]);
  const [qzCurrentIndex, setQzCurrentIndex] = useState(0);
  const [qzAnswers, setQzAnswers] = useState({});
  const [qzTimeLeft, setQzTimeLeft] = useState(0);
  const [qzGenerating, setQzGenerating] = useState(false);
  const [qzSubmitting, setQzSubmitting] = useState(false);
  const [qzStartTime, setQzStartTime] = useState(null);
  const [qzActive, setQzActive] = useState(false);
  const qzTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchFcData = useCallback(async () => {
    try {
      const params = {};
      if (fcFilter === 'favorites') params.favorites = true;
      if (fcFilter === 'due') params.due = true;
      if (fcDifficulty !== 'all') params.difficulty = fcDifficulty;
      const [cardsRes, statsRes] = await Promise.all([
        flashcardAPI.getAll(params).catch(() => ({ data: [] })),
        flashcardAPI.getStats().catch(() => ({ data: {} }))
      ]);
      setFcCards(cardsRes.data || []);
      const s = statsRes.data || {};
      setFcStats({ mastered: s.mastered || 0, learning: s.learning || 0, toReview: s.toReview || 0 });
    } catch { setFcCards([]); }
  }, [fcFilter, fcDifficulty]);

  useEffect(() => { if (tab === 'flashcards') fetchFcData(); }, [tab, fetchFcData]);

  useEffect(() => {
    if (qzActive && qzTimeLeft > 0) {
      qzTimerRef.current = setInterval(() => {
        setQzTimeLeft(prev => {
          if (prev <= 1) { clearInterval(qzTimerRef.current); handleQuizSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(qzTimerRef.current);
    }
  }, [qzActive, qzTimeLeft]);

  // Reviewer handlers
  const handleReviewGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setReviewLoading(true);
    setReviewResult(null);
    try {
      const res = await reviewerAPI.generate({ topic: topic.trim(), type: reviewType });
      setReviewResult(res.data.content);
      toast.success('Reviewer generated');
    } catch { toast.error('Failed to generate reviewer'); } finally { setReviewLoading(false); }
  };

  const reviewSections = reviewResult ? SECTION_DEFS.filter(s => reviewResult[s.key]) : [];

  // Flashcards handlers
  const handleFcGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setFcGenerating(true);
    try {
      await flashcardAPI.generate({ topic: topic.trim(), count: fcCount });
      toast.success('Flashcards generated');
      fetchFcData();
    } catch { toast.error('Failed to generate flashcards'); } finally { setFcGenerating(false); }
  };

  const handleFcToggleFavorite = async (id) => {
    try { await flashcardAPI.toggleFavorite(id); fetchFcData(); } catch { toast.error('Failed to update'); }
  };

  const handleFcReview = async (id, mastery) => {
    try { await flashcardAPI.update(id, { mastery }); fetchFcData(); } catch { toast.error('Failed to record'); }
  };

  const handleFcCreate = async () => {
    if (!fcNewCard.question || !fcNewCard.answer) return toast.error('Please fill in question and answer');
    setFcCreating(true);
    try {
      await flashcardAPI.create({ ...fcNewCard, topic: topic || 'General' });
      toast.success('Flashcard created');
      setFcShowCreate(false);
      setFcNewCard({ question: '', answer: '', difficulty: 'medium' });
      fetchFcData();
    } catch { toast.error('Failed to create'); } finally { setFcCreating(false); }
  };

  const filteredCards = fcCards.filter(c => {
    if (fcFilter === 'favorites' && !c.is_favorite) return false;
    if (fcFilter === 'due' && !c.due_for_review) return false;
    if (fcDifficulty !== 'all' && c.difficulty !== fcDifficulty) return false;
    return true;
  });

  const diffColor = (d) => {
    if (d === 'easy') return 'bg-green-500/20 text-green-400';
    if (d === 'hard') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  // Quiz handlers
  const handleQuizGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setQzGenerating(true);
    try {
      const res = await quizAPI.generate({
        topic: topic.trim(), category: qzCategory, type: qzType,
        count: qzCount, difficulty: qzDifficulty
      });
      const qs = (res.data.questions || res.data || []);
      if (!qs.length) throw new Error('No questions');
      setQzQuestions(qs);
      setQzAnswers({});
      setQzCurrentIndex(0);
      setQzTimeLeft(qs.length * 60);
      setQzStartTime(Date.now());
      setQzActive(true);
      toast.success('Quiz generated');
    } catch { toast.error('Failed to generate quiz'); } finally { setQzGenerating(false); }
  };

  const handleQuizAnswer = useCallback((idx, value) => {
    setQzAnswers(prev => ({ ...prev, [idx]: value }));
  }, []);

  const handleQuizSubmit = async () => {
    if (qzSubmitting) return;
    setQzSubmitting(true);
    if (qzTimerRef.current) clearInterval(qzTimerRef.current);
    const timeTaken = Math.floor((Date.now() - qzStartTime) / 1000);
    let correct = 0;
    const submitted = qzQuestions.map((q, i) => {
      const userAns = qzAnswers[i] || '';
      const isCorrect = String(userAns).trim().toLowerCase() === String(q.correct_answer || q.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) correct++;
      return { question_id: q.id || i, question: q.question, user_answer: userAns, correct_answer: q.correct_answer || q.correctAnswer || '', is_correct: isCorrect };
    });
    const accuracy = qzQuestions.length > 0 ? Math.round((correct / qzQuestions.length) * 100) : 0;
    try {
      await quizAPI.submit({
        topic: topic.trim(), category: qzCategory, quiz_type: qzType,
        questions: submitted, score: correct, accuracy, total_questions: qzQuestions.length,
        correct_answers: correct, time_taken: timeTaken, difficulty: qzDifficulty,
        weak_topics: accuracy < 50 ? [topic.trim()] : [], strong_topics: accuracy >= 50 ? [topic.trim()] : []
      });
      navigate('/quiz-results', {
        state: {
          topic: topic.trim(), category: qzCategory, quizType: qzType, difficulty: qzDifficulty,
          questions: submitted, score: correct, total: qzQuestions.length, accuracy, timeTaken,
          weakTopics: accuracy < 50 ? [topic.trim()] : [], strongTopics: accuracy >= 50 ? [topic.trim()] : []
        }
      });
    } catch { toast.error('Failed to submit quiz'); } finally { setQzSubmitting(false); }
  };

  const qzProgress = qzQuestions.length > 0 ? ((qzCurrentIndex + 1) / qzQuestions.length) * 100 : 0;
  const qzAllAnswered = qzQuestions.every((_, i) => qzAnswers[i] !== undefined && qzAnswers[i] !== '');
  const qzCurrent = qzQuestions[qzCurrentIndex];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={itemVariants} className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">AI Study Hub</h1>
          <p className="text-white/70 mb-6">Generate reviewers, flashcards, and quizzes on any STEM topic</p>
          <div className="relative mb-3">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && tab === 'reviewer') handleReviewGenerate(); }}
              placeholder="e.g. Newton's Laws of Motion, Photosynthesis, Calculus..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TOPIC_SUGGESTIONS.map(s => (
              <button key={s.label} onClick={() => setTopic(s.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs transition-all">
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-sky-500 text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </motion.div>

      {tab === 'reviewer' && (
        <motion.div variants={itemVariants} key="reviewer" className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Review Type</h2>
              <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg font-medium capitalize">{reviewType}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {REVIEW_TYPES.map(t => {
                const active = reviewType === t.value;
                return (
                  <button key={t.value} onClick={() => setReviewType(t.value)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                      active ? 'border-transparent shadow-lg shadow-sky-500/20' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                    }`}>
                    {active && <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-10 rounded-2xl`} />}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      active ? `bg-gradient-to-br ${t.color} text-white shadow-lg` : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}>{t.icon}</div>
                    <h3 className="font-bold mb-1">{t.label}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{t.desc}</p>
                  </button>
                );
              })}
            </div>
            <button onClick={handleReviewGenerate} disabled={reviewLoading || !topic.trim()}
              className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {reviewLoading ? 'Generating...' : 'Generate Reviewer'}
            </button>
          </div>

          {reviewLoading && (
            <div className="glass-card p-12 text-center">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold">Generating your reviewer...</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Crafting personalized study materials</p>
            </div>
          )}

          {reviewResult && !reviewLoading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold gradient-text">Generated Content</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{reviewSections.length} sections</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    if (!topic.trim()) return toast.error('No topic available');
                    try {
                      await flashcardAPI.generate({ topic: topic.trim(), count: 10 });
                      toast.success('Flashcards generated!');
                      setTab('flashcards');
                      fetchFcData();
                    } catch { toast.error('Failed to generate flashcards'); }
                  }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium transition-all hover:shadow-lg">Generate Flashcards</button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(reviewResult, null, 2))
                      .then(() => toast.success('Copied')).catch(() => toast.error('Failed to copy'));
                  }} className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-sky-500/10 text-sm font-medium border border-[var(--glass-border)] transition-all">Copy</button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reviewSections.map(s => (
                  <SectionCard key={s.key} sectionKey={s.key} icon={s.icon} title={s.title} content={reviewResult[s.key]} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === 'flashcards' && (
        <motion.div variants={itemVariants} key="flashcards" className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex gap-3 mb-4">
              {['mastered', 'learning', 'toReview'].map(k => (
                <div key={k} className="flex-1 p-3 rounded-xl bg-[var(--bg-secondary)] text-center">
                  <p className="text-lg font-bold">{fcStats[k] || 0}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] capitalize">{k.replace('toReview', 'to review').replace(/([A-Z])/g, ' $1')}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFcGenerate()}
                placeholder="Enter a topic..." className="flex-1 input-field" />
              <select value={fcCount} onChange={e => setFcCount(Number(e.target.value))} className="input-field w-28">
                {COUNT_OPTIONS.map(c => <option key={c} value={c}>{c} cards</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleFcGenerate} disabled={fcGenerating || !topic.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium text-sm disabled:opacity-50 transition-all">
                {fcGenerating ? 'Generating...' : 'Generate Flashcards'}
              </button>
              <button onClick={() => setFcShowCreate(true)}
                className="py-2.5 px-5 rounded-xl bg-[var(--bg-secondary)] hover:bg-sky-500/10 text-sm font-medium border border-[var(--glass-border)] transition-all">+ Create</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              {FILTER_TABS.map(f => (
                <button key={f} onClick={() => setFcFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    fcFilter === f ? 'bg-sky-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>{f === 'all' ? 'All' : f === 'favorites' ? 'Favorites' : 'Due'}</button>
              ))}
            </div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setFcDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    fcDifficulty === d ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-4xl mb-3">🎴</p>
              <p className="text-[var(--text-secondary)]">No flashcards found</p>
              <p className="text-sm text-[var(--text-secondary)]/60 mt-1">Generate or create flashcards to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card, i) => {
                const flipped = fcFlippedId === card.id;
                return (
                  <motion.div key={card.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="relative cursor-pointer" style={{ perspective: '1000px', minHeight: '260px' }}
                    onClick={() => setFcFlippedId(flipped ? null : card.id)}>
                    <div style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      className="absolute inset-0">
                      <div style={{ backfaceVisibility: 'hidden' }} className="glass-card p-5 h-full flex flex-col border border-[var(--glass-border)]">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/20 text-sky-400 font-medium">{card.topic}</span>
                          <button onClick={e => { e.stopPropagation(); handleFcToggleFavorite(card.id); }}
                            className={`text-lg ${card.is_favorite ? 'text-red-400' : 'text-[var(--text-secondary)]'} hover:text-red-400 transition-colors shrink-0`}>
                            {card.is_favorite ? '♥' : '♡'}
                          </button>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-4">
                          <p className="text-base font-medium text-center leading-relaxed">{card.question}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--glass-border)]">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${diffColor(card.difficulty)}`}>{card.difficulty}</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">Tap to flip</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      className="absolute inset-0">
                      <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="glass-card p-5 h-full flex flex-col border-2 border-sky-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-sky-400">Answer</span>
                          <button onClick={e => { e.stopPropagation(); setFcFlippedId(null); }} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-4">
                          <p className="text-base text-center leading-relaxed">{card.answer}</p>
                        </div>
                        <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--glass-border)]">
                          <button onClick={e => { e.stopPropagation(); handleFcReview(card.id, 'mastered'); }}
                            className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30">Mastered</button>
                          <button onClick={e => { e.stopPropagation(); handleFcReview(card.id, 'again'); }}
                            className="flex-1 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30">Review</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {fcShowCreate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="glass-card p-6 w-full max-w-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold gradient-text">Create Flashcard</h2>
                    <button onClick={() => setFcShowCreate(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-lg">✕</button>
                  </div>
                  <div className="space-y-4">
                    <textarea value={fcNewCard.question} onChange={e => setFcNewCard({ ...fcNewCard, question: e.target.value })}
                      rows={3} placeholder="Enter your question..." className="input-field w-full resize-none" />
                    <textarea value={fcNewCard.answer} onChange={e => setFcNewCard({ ...fcNewCard, answer: e.target.value })}
                      rows={3} placeholder="Enter the answer..." className="input-field w-full resize-none" />
                    <div className="flex gap-3">
                      {['easy', 'medium', 'hard'].map(d => (
                        <button key={d} onClick={() => setFcNewCard({ ...fcNewCard, difficulty: d })}
                          className={`flex-1 p-2.5 rounded-xl border text-sm font-medium capitalize ${
                            fcNewCard.difficulty === d ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-white/20'
                          }`}>{d}</button>
                      ))}
                    </div>
                    <button onClick={handleFcCreate} disabled={!fcNewCard.question || !fcNewCard.answer || fcCreating}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium disabled:opacity-50 transition-all">
                      {fcCreating ? 'Creating...' : 'Create Flashcard'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {tab === 'quiz' && (
        <motion.div variants={itemVariants} key="quiz" className="space-y-6">
          {!qzActive ? (
            <div className="glass-card p-6">
              <h2 className="font-semibold text-lg mb-4">Quiz Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={qzCategory} onChange={e => setQzCategory(e.target.value)} className="input-field w-full">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Quiz Type</label>
                  <select value={qzType} onChange={e => setQzType(e.target.value)} className="input-field w-full">
                    {QUIZ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTY_LEVELS.map(d => (
                      <button key={d} onClick={() => setQzDifficulty(d)}
                        className={`flex-1 p-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                          qzDifficulty === d ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-white/20'
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Questions</label>
                  <select value={qzCount} onChange={e => setQzCount(Number(e.target.value))} className="input-field w-full">
                    {COUNT_OPTIONS.map(c => <option key={c} value={c}>{c} questions</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleQuizGenerate} disabled={qzGenerating || !topic.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {qzGenerating ? 'Generating...' : 'Generate Quiz'}
              </button>
            </div>
          ) : (
            <div>
              <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-bold gradient-text">{topic}</h1>
                    <p className="text-sm text-[var(--text-secondary)] capitalize">{qzCategory.replace('_', ' ')} • {qzType.replace('-', ' ')} • {qzDifficulty} • {qzQuestions.length} questions</p>
                  </div>
                  <QuizTimer timeLeft={qzTimeLeft} />
                </div>
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-6 overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${qzProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-[var(--text-secondary)]">Question {qzCurrentIndex + 1} of {qzQuestions.length}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{Object.keys(qzAnswers).length} answered</p>
                </div>

                {qzCurrent && (
                  <div className="space-y-4">
                    <p className="text-lg font-medium">{qzCurrent.question}</p>
                    {qzCurrent.type === 'true_false' || qzType === 'true_false' ? (
                      <div className="flex gap-3">
                        {['True', 'False'].map(opt => (
                          <button key={opt} onClick={() => handleQuizAnswer(qzCurrentIndex, opt)}
                            className={`flex-1 p-4 rounded-xl border-2 text-center font-medium transition-all ${
                              qzAnswers[qzCurrentIndex] === opt ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                            }`}>{opt}</button>
                        ))}
                      </div>
                    ) : qzCurrent.options ? (
                      <div className="space-y-2">
                        {qzCurrent.options.map((opt, j) => (
                          <button key={j} onClick={() => handleQuizAnswer(qzCurrentIndex, opt)}
                            className={`w-full p-3 rounded-xl border text-left text-sm transition-all ${
                              qzAnswers[qzCurrentIndex] === opt ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                            }`}>{opt}</button>
                        ))}
                      </div>
                    ) : (
                      <textarea value={qzAnswers[qzCurrentIndex] || ''} onChange={e => handleQuizAnswer(qzCurrentIndex, e.target.value)}
                        rows={3} placeholder="Type your answer..." className="input-field w-full resize-none" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-[var(--glass-border)]">
                  <button onClick={() => setQzCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={qzCurrentIndex === 0}
                    className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">← Previous</button>
                  <div className="flex gap-1">
                    {qzQuestions.map((_, i) => (
                      <button key={i} onClick={() => setQzCurrentIndex(i)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-medium transition-all ${
                          i === qzCurrentIndex ? 'bg-sky-500 text-white' :
                          qzAnswers[i] !== undefined ? 'bg-sky-500/20 text-sky-400' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                        }`}>{i + 1}</button>
                    ))}
                  </div>
                  {qzCurrentIndex < qzQuestions.length - 1 ? (
                    <button onClick={() => setQzCurrentIndex(prev => Math.min(qzQuestions.length - 1, prev + 1))}
                      className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">Next →</button>
                  ) : (
                    <button onClick={handleQuizSubmit} disabled={qzSubmitting || !qzAllAnswered}
                      className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {qzSubmitting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Submitting...</> : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIStudyHub;