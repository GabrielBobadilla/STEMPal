import React from 'react';
import { motion } from 'framer-motion';

const QUIZ_TYPES = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True or False' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'identification', label: 'Identification' },
];

const CATEGORIES = [
  { value: 'mathematics', label: 'Mathematics', icon: '🔢' },
  { value: 'physics', label: 'Physics', icon: '⚛️' },
  { value: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { value: 'biology', label: 'Biology', icon: '🧬' },
  { value: 'computer_science', label: 'Computer Science', icon: '💻' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', icon: '🌱' },
  { value: 'medium', label: 'Medium', icon: '🔥' },
  { value: 'hard', label: 'Hard', icon: '💀' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const QuizSetup = ({ topic, category, quizType, difficulty, questionCount, generating, history,
  onTopicChange, onCategoryChange, onTypeChange, onDifficultyChange, onCountChange, onGenerate }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-6">
    <motion.div variants={itemVariants}>
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">🧠 Adaptive Quizzes</h1>
      <p className="text-[var(--text-secondary)] text-sm mt-1">AI-powered quizzes that adapt to your level</p>
    </motion.div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">New Quiz</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g., Photosynthesis, Calculus, Thermodynamics..."
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                  className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2 ${
                    category === cat.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quiz Type</label>
            <div className="grid grid-cols-2 gap-2">
              {QUIZ_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onTypeChange(type.value)}
                  className={`p-2.5 rounded-xl border transition-all text-center ${
                    quizType === type.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => onDifficultyChange(diff.value)}
                    className={`flex-1 p-2.5 rounded-xl border transition-all text-center ${
                      difficulty === diff.value
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm">{diff.icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Questions</label>
              <div className="flex gap-2">
                {COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => onCountChange(count)}
                    className={`flex-1 p-2.5 rounded-xl border transition-all text-center ${
                      questionCount === count
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-medium">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={!topic || generating}
            className="btn-primary w-full py-3 mt-2"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Quiz...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">✨ Start Quiz</span>
            )}
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Quizzes</h2>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🧠</p>
            <p className="text-sm text-[var(--text-secondary)]">No quizzes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 6).map(q => (
              <div key={q._id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div>
                  <div className="text-sm font-medium">{q.topic}</div>
                  <div className="text-xs text-[var(--text-secondary)] capitalize">
                    {q.category?.replace('_', ' ') || ''} • {q.difficulty}
                  </div>
                </div>
                <div className={`text-lg font-bold ${q.accuracy >= 80 ? 'text-green-500' : q.accuracy >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {q.accuracy}%
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  </motion.div>
);

export { QUIZ_TYPES, CATEGORIES, DIFFICULTIES, COUNT_OPTIONS, containerVariants, itemVariants };
export default QuizSetup;
