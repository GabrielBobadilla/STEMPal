import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionCard = ({ question, index, quizType, answers, onAnswer }) => {
  const renderQuestionInput = (q) => {
    const currentAnswer = answers[q.id] || '';

    switch (quizType) {
      case 'multiple-choice':
      case 'multiple choice':
        return (
          <div className="space-y-3">
            {q.options?.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => onAnswer(q.id, opt)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  currentAnswer === opt
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        );

      case 'true-false':
      case 'true or false':
        return (
          <div className="flex gap-4">
            {['True', 'False'].map((opt) => (
              <button
                key={opt}
                onClick={() => onAnswer(q.id, opt)}
                className={`flex-1 p-4 rounded-xl border transition-all text-center ${
                  currentAnswer === opt
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-sm font-medium">{opt}</span>
              </button>
            ))}
          </div>
        );

      case 'short-answer':
      case 'short answer':
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            placeholder="Type your answer..."
            className="input-field w-full"
          />
        );

      case 'identification':
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            placeholder="Enter your answer..."
            className="input-field w-full"
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            placeholder="Type your answer..."
            className="input-field w-full"
          />
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="glass-card p-6"
      >
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <div className="flex-1">
            <p className="text-lg font-medium mb-4">{question.question}</p>
            {renderQuestionInput(question)}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
