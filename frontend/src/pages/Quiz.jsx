import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { value: 'mathematics', label: 'Mathematics', icon: '🔢', color: 'from-blue-400 to-blue-600' },
  { value: 'physics', label: 'Physics', icon: '⚛️', color: 'from-purple-400 to-purple-600' },
  { value: 'chemistry', label: 'Chemistry', icon: '🧪', color: 'from-emerald-400 to-emerald-600' },
  { value: 'biology', label: 'Biology', icon: '🧬', color: 'from-green-400 to-green-600' },
  { value: 'computer_science', label: 'Computer Science', icon: '💻', color: 'from-cyan-400 to-cyan-600' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️', color: 'from-amber-400 to-amber-600' },
];

const QUIZ_TYPES = [
  { value: 'mixed', label: 'Mixed', icon: '🎲', desc: 'Random mix of formats' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '✅', desc: 'Pick the correct option' },
  { value: 'true_false', label: 'True or False', icon: '⚖️', desc: 'Decide true or false' },
  { value: 'identification', label: 'Identification', icon: '✏️', desc: 'Type your answer' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', icon: '🌱', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { value: 'medium', label: 'Medium', icon: '🔥', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'hard', label: 'Hard', icon: '💀', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const Quiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('setup');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('mathematics');
  const [quizType, setQuizType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (step === 'quiz' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [step, timeLeft]);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setGenerating(true);
    try {
      const res = await quizAPI.generate({
        topic: topic.trim(), category,
        type: quizType, count: questionCount,
        difficulty: difficulty.toLowerCase()
      });
      const qs = (res.data.questions || res.data || []);
      if (!qs.length) throw new Error('No questions returned');
      setQuestions(qs);
      setAnswers({});
      setCurrentIndex(0);
      setTimeLeft(qs.length * 60);
      setStartTime(Date.now());
      setStep('quiz');
      toast.success('Quiz generated successfully');
    } catch { toast.error('Failed to generate quiz'); } finally { setGenerating(false); }
  };

  const handleAnswer = useCallback((questionIndex, value) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    let correctAnswers = 0;
    const submittedAnswers = questions.map((q, i) => {
      const userAns = answers[i] || '';
      const isCorrect = String(userAns).trim().toLowerCase() === String(q.correct_answer || q.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) correctAnswers++;
      return { question_id: q.id || i, question: q.question, user_answer: userAns, correct_answer: q.correct_answer || q.correctAnswer || '', is_correct: isCorrect };
    });
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    try {
      const weakTopics = accuracy < 50 ? [topic.trim()] : [];
      const strongTopics = accuracy >= 50 ? [topic.trim()] : [];
      await quizAPI.submit({
        topic: topic.trim(), category, quiz_type: quizType,
        questions: submittedAnswers, score: correctAnswers, accuracy,
        total_questions: questions.length, correct_answers: correctAnswers,
        time_taken: timeTaken, difficulty: difficulty.toLowerCase(),
        weak_topics: weakTopics, strong_topics: strongTopics
      });
      if (weakTopics.length > 0) {
        quizAPI.generateAdaptive({ topics: weakTopics, count: Math.min(5, questions.length), difficulty: difficulty.toLowerCase() }).catch(() => {});
      }
      navigate('/quiz-results', {
        state: {
          topic: topic.trim(), category, quizType, difficulty,
          questions: submittedAnswers, score: correctAnswers,
          total: questions.length, accuracy, timeTaken,
          weakTopics, strongTopics
        }
      });
    } catch { toast.error('Failed to submit quiz'); } finally { setSubmitting(false); }
  };

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] !== '');
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (step === 'setup') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-[#60C5FF] to-[#0EA5E9] p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">AI-Powered Quiz Generator</h1>
            <p className="text-white/70 mb-6">Test your knowledge with custom quizzes on any STEM topic</p>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Photosynthesis, Calculus, Thermodynamics..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4">Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(c => {
              const active = category === c.value;
              return (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    active ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-lg mx-auto mb-2`}>{c.icon}</div>
                  <p className="text-xs font-medium">{c.label}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Quiz Type</h2>
            <div className="space-y-2">
              {QUIZ_TYPES.map(t => {
                const active = quizType === t.value;
                return (
                  <button key={t.value} onClick={() => setQuizType(t.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{t.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Difficulty</h2>
            <div className="space-y-3">
              {DIFFICULTIES.map(d => {
                const active = difficulty === d.value;
                return (
                  <button key={d.value} onClick={() => setDifficulty(d.value)}
                    className={`w-full p-4 rounded-xl border-2 text-center transition-all ${
                      active ? d.color : 'border-[var(--glass-border)] hover:border-sky-300/50'
                    }`}>
                    <p className="text-2xl mb-1">{d.icon}</p>
                    <p className="text-sm font-medium capitalize">{d.label}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Questions</h2>
            <div className="grid grid-cols-2 gap-3">
              {COUNT_OPTIONS.map(c => {
                const active = questionCount === c;
                return (
                  <button key={c} onClick={() => setQuestionCount(c)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      active ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--glass-border)] hover:border-sky-300/50'
                    }`}>
                    <p className="text-2xl font-bold">{c}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">questions</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={handleGenerate} disabled={!topic.trim() || generating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#60C5FF] to-[#38BDF8] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-sky-500/20">
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Quiz...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">✨ Generate Quiz</span>
          )}
        </motion.button>
      </div>
    );
  }

  if (!questions.length) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#60C5FF] to-[#0EA5E9] p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{topic}</h1>
              <p className="text-white/60 text-xs capitalize">{category.replace('_', ' ')} • {quizType.replace('_', ' ')} • {difficulty}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">⏱ {formatTime(timeLeft)}</span>
              <span className="text-sm text-white/70">{Object.keys(answers).length}/{questions.length}</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </motion.div>

      <div className="flex gap-2 justify-center">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              i === currentIndex ? 'bg-sky-500 text-white shadow-md' :
              answers[i] !== undefined ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}>{i + 1}</button>
        ))}
      </div>

      <motion.div key={currentIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }} className="glass-card p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#60C5FF] to-[#38BDF8] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {currentIndex + 1}
            </span>
            <p className="text-lg font-medium flex-1">{currentQuestion.question}</p>
          </div>

          {currentQuestion.type === 'true_false' || quizType === 'true_false' ? (
            <div className="flex gap-4">
              {['True', 'False'].map(opt => (
                <button key={opt} onClick={() => handleAnswer(currentIndex, opt)}
                  className={`flex-1 p-5 rounded-2xl border-2 text-center text-lg font-medium transition-all ${
                    answers[currentIndex] === opt ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-lg' : 'border-[var(--glass-border)] hover:border-sky-300/50 hover:bg-white/5'
                  }`}>{opt}</button>
              ))}
            </div>
          ) : currentQuestion.options ? (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, j) => (
                <button key={j} onClick={() => handleAnswer(currentIndex, opt)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    answers[currentIndex] === opt ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-md' : 'border-[var(--glass-border)] hover:border-sky-300/50 hover:bg-white/5'
                  }`}>
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + j)}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <textarea value={answers[currentIndex] || ''} onChange={e => handleAnswer(currentIndex, e.target.value)}
              rows={4} placeholder="Type your answer here..."
              className="input-field w-full resize-none text-lg" />
          )}
        </motion.div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}
          className="btn-secondary px-5 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">← Previous</button>

        {currentIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentIndex(prev => prev + 1)}
            className="btn-primary px-5 py-3 text-sm flex items-center gap-2">Next →</button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !allAnswered}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:shadow-lg">
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Submitting...</>
            ) : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;