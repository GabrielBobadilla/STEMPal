import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { reviewerAPI } from '../services/api';
import { toast } from 'react-toastify';
import ReviewTypeCard from '../components/reviewer/ReviewTypeCard';
import SectionCard from '../components/reviewer/SectionCard';
import HistoryList from '../components/reviewer/HistoryList';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Reviewer = () => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await reviewerAPI.getAll();
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
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
    } catch {
      toast.error('Failed to generate reviewer');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReviewer = async (item) => {
    try {
      const res = await reviewerAPI.get(item.id);
      setResult(res.data.content || res.data);
    } catch {
      toast.error('Failed to load reviewer');
    }
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy')
    );
  }, [result]);

  const handleExportPDF = () => {
    toast.info('PDF export coming soon');
  };

  const sections = result ? [
    { title: 'Summary', key: 'summary', icon: '📝' },
    { title: 'Key Concepts', key: 'key_concepts', icon: '💡' },
    { title: 'Definitions', key: 'definitions', icon: '📖' },
    { title: 'Formulas', key: 'formulas', icon: '📐' },
    { title: 'Practice Questions', key: 'practice_questions', icon: '✍️' }
  ] : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">AI Reviewer Generator</h1>
        <p className="text-[var(--text-secondary)] mb-6">Generate comprehensive study materials on any STEM topic</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Newton's Laws of Motion, Photosynthesis, Calculus Derivatives..."
              className="input-field"
            />
          </div>

          <ReviewTypeCard type={type} onTypeChange={setType} />

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              'Generate Reviewer'
            )}
          </button>
        </div>
      </motion.div>

      {loading && (
        <motion.div variants={itemVariants} className="glass-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Generating your reviewer...</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">This may take a moment</p>
        </motion.div>
      )}

      {result && !loading && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Generated Content</h2>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn-secondary text-sm px-4 py-2">📋 Copy</button>
              <button onClick={handleExportPDF} className="btn-primary text-sm px-4 py-2">📄 Export PDF</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sections.map((section) => {
              const data = result[section.key];
              if (!data) return null;
              return <SectionCard key={section.key} icon={section.icon} title={section.title} content={data} />;
            })}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">History</h2>
          <button onClick={fetchHistory} className="text-sm text-primary-500 hover:underline shrink-0">
            Refresh
          </button>
        </div>
        <HistoryList history={history} loading={historyLoading} onRefresh={fetchHistory} onSelect={handleSelectReviewer} />
      </motion.div>
    </motion.div>
  );
};

export default Reviewer;
