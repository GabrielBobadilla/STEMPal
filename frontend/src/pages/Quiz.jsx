import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import QuizSetup from '../components/quiz/QuizSetup';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizTimer from '../components/quiz/QuizTimer';
import QuestionNav from '../components/quiz/QuestionNav';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
  const [quizHistory, setQuizHistory] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === 'setup') fetchHistory();
  }, [step]);

  useEffect(() => {
    if (step === 'quiz' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [step, timeLeft]);

  const fetchHistory = async () => {
    try {
      const res = await quizAPI.getAll({ limit: 10 });
      setQuizHistory(res.data?.quizzes || res.data || []);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setGenerating(true);
    try {
      const res = await quizAPI.generate({
        topic: topic.trim(),
        category,
        type: quizType,
        count: questionCount,
        difficulty: difficulty.toLowerCase()
      });
      const data = res.data;
      const qs = data.questions || data || [];
      if (!qs.length) throw new Error('No questions returned');
      setQuestions(qs);
      setAnswers({});
      setCurrentIndex(0);
      setTimeLeft(qs.length * 60);
      setStartTime(Date.now());
      setStep('quiz');
      toast.success('Quiz generated successfully');
    } catch {
      toast.error('Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = useCallback((questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  }, []);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

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
      return {
        question_id: q.id || i,
        question: q.question,
        user_answer: userAns,
        correct_answer: q.correct_answer || q.correctAnswer || '',
        is_correct: isCorrect
      };
    });

    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

    try {
      const weakTopics = [];
      const strongTopics = [];
      if (accuracy < 50) weakTopics.push(topic.trim());
      else strongTopics.push(topic.trim());

      await quizAPI.submit({
        topic: topic.trim(),
        category,
        quiz_type: quizType,
        questions: submittedAnswers,
        answers: submittedAnswers,
        score: correctAnswers,
        accuracy,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        time_taken: timeTaken,
        difficulty: difficulty.toLowerCase(),
        weak_topics: weakTopics,
        strong_topics: strongTopics
      });

      if (weakTopics.length > 0) {
        quizAPI.generateAdaptive({
          topics: weakTopics,
          count: Math.min(5, questions.length),
          difficulty: difficulty.toLowerCase()
        }).catch(() => {});
      }

      navigate('/quiz-results', {
        state: {
          topic: topic.trim(),
          category,
          quizType,
          difficulty,
          questions: submittedAnswers,
          score: correctAnswers,
          total: questions.length,
          accuracy,
          timeTaken,
          weakTopics,
          strongTopics
        }
      });
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (step === 'setup') {
    return (
      <QuizSetup
        topic={topic}
        category={category}
        quizType={quizType}
        difficulty={difficulty}
        questionCount={questionCount}
        generating={generating}
        history={quizHistory}
        onTopicChange={setTopic}
        onCategoryChange={setCategory}
        onTypeChange={setQuizType}
        onDifficultyChange={setDifficulty}
        onCountChange={setQuestionCount}
        onGenerate={handleGenerate}
      />
    );
  }

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] !== '');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold gradient-text">{topic}</h1>
            <p className="text-sm text-[var(--text-secondary)] capitalize">
              {category?.replace('_', ' ')} • {quizType.replace('-', ' ')} • {difficulty} • {questions.length} questions
            </p>
          </div>
          <QuizTimer timeLeft={timeLeft} />
        </div>

        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="h-full gradient-bg rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {Object.keys(answers).length} answered
          </p>
        </div>

        <QuestionCard
          question={currentQuestion}
          index={currentIndex}
          quizType={quizType === 'mixed' ? currentQuestion.type || 'multiple-choice' : quizType}
          answers={answers}
          onAnswer={handleAnswer}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-4 border-t border-[var(--glass-border)]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ← Previous
          </button>

          <QuestionNav
            total={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            onNavigate={setCurrentIndex}
          />

          {currentIndex < questions.length - 1 ? (
            <button onClick={handleNext} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Quiz;
