import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const CircularProgress = ({ value, max, size = 160, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;
  const percentage = Math.round((value / max) * 100);

  const color = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bg-secondary)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        className="transform rotate-90"
        fill="var(--text-primary)"
        fontSize="2.5rem"
        fontWeight="bold"
      >
        {value}
      </text>
    </svg>
  );
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const suggestionCards = [
  {
    title: 'Continue Studying',
    desc: 'Generate a new quiz on similar topics',
    icon: '📚',
    path: '/quiz',
    color: 'from-sky-500 to-cyan-500'
  },
  {
    title: 'Review Notes',
    desc: 'Check your saved notes and reviewers',
    icon: '📝',
    path: '/reviewer',
    color: 'from-sky-500 to-cyan-500'
  },
  {
    title: 'Generate Flashcards',
    desc: 'Create flashcards to reinforce weak topics',
    icon: '🎴',
    path: '/flashcards',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Take a Break',
    desc: 'Step away and recharge',
    icon: '☕',
    path: '/breaks',
    color: 'from-yellow-500 to-orange-500'
  }
];

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg font-semibold mb-2">No Results Found</p>
          <p className="text-[var(--text-secondary)] mb-6">Complete a quiz first to see your results here.</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary">Go to Quiz</button>
        </div>
      </div>
    );
  }

  const {
    topic = 'Quiz',
    score = 0,
    total = 0,
    accuracy = 0,
    timeTaken = 0,
    weakTopics = [],
    strongTopics = [],
    quizType = '',
    difficulty = ''
  } = data;

  const xpEarned = Math.round((accuracy / 100) * total * 10) + (total * 2);

  const handleRetake = () => {
    navigate('/quiz', {
      state: { retakeTopic: topic, retakeDifficulty: difficulty, retakeType: quizType }
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold gradient-text mb-1">Quiz Complete!</h1>
          <p className="text-[var(--text-secondary)] text-sm capitalize">{topic} {quizType ? `• ${quizType.replace('-', ' ')}` : ''} {difficulty ? `• ${difficulty}` : ''}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
          <div className="flex-shrink-0">
            <CircularProgress value={score} max={total} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 max-w-md">
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-2xl font-bold gradient-text">{accuracy}%</p>
              <p className="text-xs text-[var(--text-secondary)]">Accuracy</p>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-2xl font-bold gradient-text">{formatTime(timeTaken)}</p>
              <p className="text-xs text-[var(--text-secondary)]">Time Taken</p>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-2xl font-bold gradient-text">{total}</p>
              <p className="text-xs text-[var(--text-secondary)]">Total Questions</p>
            </div>
            <div className="glass p-4 rounded-xl text-center col-span-2 md:col-span-3">
              <p className="text-2xl font-bold">
                <span className="gradient-text">+{xpEarned}</span>
                <span className="text-sm ml-1 text-[var(--text-secondary)]">XP</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Experience Points Earned</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
              <span>⚡</span> Weak Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {weakTopics.length > 0 ? weakTopics.map((topic, i) => (
                <span key={i} className="badge-danger text-xs px-3 py-1 rounded-full">
                  {topic}
                </span>
              )) : (
                <span className="text-xs text-[var(--text-secondary)]">No weak topics identified</span>
              )}
            </div>
          </div>
          <div className="glass p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-2">
              <span>🌟</span> Strong Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {strongTopics.length > 0 ? strongTopics.map((topic, i) => (
                <span key={i} className="badge-success text-xs px-3 py-1 rounded-full">
                  {topic}
                </span>
              )) : (
                <span className="text-xs text-[var(--text-secondary)]">No strong topics identified</span>
              )}
            </div>
          </div>
        </div>

        {weakTopics.length > 0 && (
          <div className="glass p-4 rounded-xl mb-6">
            <h3 className="text-sm font-semibold gradient-text mb-3">AI Recommendations</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Based on your performance, AI has generated adaptive quiz suggestions for your weak topics.
            </p>
            <button
              onClick={() => {
                quizAPI.generateAdaptive({
                  topics: weakTopics,
                  count: 5,
                  difficulty: difficulty.toLowerCase() || 'medium'
                }).then((res) => {
                  navigate('/quiz', { state: { adaptiveQuestions: res.data.questions || res.data } });
                }).catch(() => {
                  toast.error('Could not generate adaptive quiz');
                });
              }}
              className="btn-primary text-sm px-4 py-2"
            >
              Generate Adaptive Quiz
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {suggestionCards.map((card, i) => (
            <div
              key={i}
              onClick={() => navigate(card.path)}
              className="glass-card p-4 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          ← Back to Dashboard
        </button>
        <button onClick={handleRetake} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Retake Quiz →
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
