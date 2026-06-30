import React, { useState } from 'react';
import { motion } from 'framer-motion';

const sectionStyles = {
  summary: { gradient: 'from-sky-400/20 to-blue-500/10', icon: '📝', accent: 'border-l-sky-400' },
  key_concepts: { gradient: 'from-violet-400/20 to-purple-500/10', icon: '💡', accent: 'border-l-violet-400' },
  definitions: { gradient: 'from-emerald-400/20 to-green-500/10', icon: '📖', accent: 'border-l-emerald-400' },
  formula_sheet: { gradient: 'from-amber-400/20 to-orange-500/10', icon: '📐', accent: 'border-l-amber-400' },
  formulas: { gradient: 'from-amber-400/20 to-orange-500/10', icon: '📐', accent: 'border-l-amber-400' },
  practice_questions: { gradient: 'from-rose-400/20 to-pink-500/10', icon: '✍️', accent: 'border-l-rose-400' },
};

function renderContent(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-sm text-[var(--text-secondary)] italic">No items</p>;
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5">
            <span className="mt-0.5 w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-400 shrink-0">{i + 1}</span>
            <div className="text-sm leading-relaxed flex-1">
              {typeof item === 'object' ? (
                <div className="space-y-1">
                  {item.term && <span className="font-semibold text-primary-400">{item.term}</span>}
                  {item.question && <span className="font-semibold text-primary-400">{item.question}</span>}
                  {item.mistake && <span className="font-semibold text-primary-400">{item.mistake}</span>}
                  {item.name && <span className="font-semibold text-primary-400">{item.name}</span>}
                  {item.topic && <span className="font-semibold text-primary-400">{item.topic}</span>}
                  {(item.definition || item.answer || item.correction || item.description || item.explanation) && (
                    <div className="mt-0.5">
                      {item.definition && <p>{item.definition}</p>}
                      {item.answer && <p className="text-green-400">✓ {item.answer}</p>}
                      {item.correction && <p className="text-green-400">{item.correction}</p>}
                      {item.description && <p>{item.description}</p>}
                      {item.explanation && <p className="text-[var(--text-secondary)] text-xs mt-1">{item.explanation}</p>}
                    </div>
                  )}
                  {item.formula && (
                    <div className="mt-1 px-3 py-1.5 bg-amber-500/10 rounded-lg font-mono text-sm text-amber-300">{item.formula}</div>
                  )}
                  {item.options && (
                    <div className="mt-1 space-y-1">
                      {item.options.map((opt, j) => (
                        <div key={j} className={`text-xs px-2 py-0.5 rounded ${j === Number(item.answer) ? 'bg-green-500/20 text-green-400' : 'text-[var(--text-secondary)]'}`}>{opt}</div>
                      ))}
                    </div>
                  )}
                  {item.difficulty && (
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 font-medium ${
                      item.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      item.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>{item.difficulty}</span>
                  )}
                </div>
              ) : (
                <span>{item}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex gap-2 p-2 rounded-xl bg-white/5">
            <span className="font-semibold text-primary-400 min-w-[120px] text-sm capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="text-sm">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (typeof data === 'string') {
    return <p className="text-sm leading-relaxed whitespace-pre-line">{data}</p>;
  }
  return <p className="text-sm">{String(data)}</p>;
}

const SectionCard = ({ icon, title, content, sectionKey }) => {
  const [open, setOpen] = useState(true);
  const style = sectionStyles[sectionKey] || { gradient: 'from-gray-400/20 to-gray-500/10', icon, accent: 'border-l-gray-400' };

  return (
    <motion.div layout className={`rounded-2xl border border-[var(--glass-border)] overflow-hidden bg-gradient-to-br ${style.gradient}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-bold text-base">{title}</h3>
        </div>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--glass-border)]"
          >
            <div className="p-4 pt-3">
              {renderContent(content)}
            </div>
          </motion.div>
        )}
    </motion.div>
  );
};

export default SectionCard;