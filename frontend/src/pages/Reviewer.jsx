import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewerAPI } from '../services/api';
import { toast } from 'react-toastify';
import ReviewTypeCard from '../components/reviewer/ReviewTypeCard';
import SectionCard from '../components/reviewer/SectionCard';
import HistoryList from '../components/reviewer/HistoryList';

const topicSuggestions = [
  { label: "Newton's Laws", icon: '⚛️' },
  { label: 'Photosynthesis', icon: '🌿' },
  { label: 'Calculus', icon: '∫' },
  { label: 'DNA Structure', icon: '🧬' },
  { label: 'Thermodynamics', icon: '🔥' },
  { label: 'Linear Algebra', icon: '⬡' },
];

const sectionDefs = [
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

const Reviewer = () => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await reviewerAPI.getAll();
      setHistory(res.data || []);
    } catch { setHistory([]); } finally { setHistoryLoading(false); }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic');
    setLoading(true);
    setResult(null);
    try {
      const res = await reviewerAPI.generate({ topic: topic.trim(), type });
      setResult(res.data.content);
      toast.success('Reviewer generated successfully');
      fetchHistory();
    } catch { toast.error('Failed to generate reviewer'); } finally { setLoading(false); }
  };

  const handleSelectReviewer = async (item) => {
    try {
      const res = await reviewerAPI.get(item.id);
      setResult(res.data.content || res.data);
    } catch { toast.error('Failed to load reviewer'); }
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy')
    );
  }, [result]);

  const handleExportPDF = () => toast.info('PDF export coming soon');

  const sections = result ? sectionDefs.filter(s => result[s.key]) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🤖</div>
            <h1 className="text-2xl font-bold text-white">AI Reviewer Generator</h1>
          </div>
          <p className="text-white/70 mb-6">Generate comprehensive study materials on any STEM topic</p>

          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Newton's Laws of Motion, Photosynthesis, Calculus..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {topicSuggestions.map((s) => (
              <button key={s.label} onClick={() => setTopic(s.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs transition-all"
              ><span>{s.icon}</span>{s.label}</button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Review Type</h2>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg font-medium capitalize">{type}</span>
        </div>
        <ReviewTypeCard type={type} onTypeChange={setType} />

        <motion.button onClick={handleGenerate} disabled={loading || !topic.trim()}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              Generate Reviewer
            </>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-12 text-center"
          >
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
            </div>
            <p className="text-[var(--text-primary)] font-semibold">Generating your reviewer...</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Crafting personalized study materials</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold gradient-text">Generated Content</h2>
                <p className="text-sm text-[var(--text-secondary)]">{sections.length} sections • {type} review</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-primary-500/10 text-sm font-medium transition-all border border-[var(--glass-border)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium transition-all shadow-lg shadow-primary-500/25"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sections.map((section) => (
                <SectionCard key={section.key} sectionKey={section.key} icon={section.icon} title={section.title} content={result[section.key]} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">History</h2>
            {history.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-medium">{history.length}</span>
            )}
          </div>
          <button onClick={fetchHistory} className="text-sm text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1 transition-colors">
            <svg className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <HistoryList history={history} loading={historyLoading} onRefresh={fetchHistory} onSelect={handleSelectReviewer} />
      </motion.div>
    </div>
  );
};

export default Reviewer;