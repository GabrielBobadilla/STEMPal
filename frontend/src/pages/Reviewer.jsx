import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { reviewerAPI, pdfAPI } from '../services/api';
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
  const [tab, setTab] = useState('text');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [activePdf, setActivePdf] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleGenerateFromPdf = async () => {
    if (!pdfData) return toast.error('No PDF content available');
    setLoading(true);
    setResult(null);
    try {
      const title = pdfData.title || pdfData.filename || 'PDF Content';
      const res = await reviewerAPI.generate({ topic: title, type, content: pdfData.extracted_text || pdfData.content });
      setResult(res.data.content);
      toast.success('Reviewer generated from PDF');
      fetchHistory();
    } catch { toast.error('Failed to generate reviewer from PDF'); } finally { setLoading(false); }
  };

  const handleSelectReviewer = async (item) => {
    try {
      const res = await reviewerAPI.get(item.id);
      setResult(res.data.content || res.data);
    } catch { toast.error('Failed to load reviewer'); }
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  }, [result]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.endsWith('.pdf'))) setFile(f);
    else toast.error('Please upload a PDF file');
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) setFile(f);
      else toast.error('Please upload a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setUploading(true);
    setPdfData(null);
    setActivePdf(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await pdfAPI.upload(fd);
      setActivePdf(res.data);
      toast.success('File uploaded');
    } catch { toast.error('Failed to upload file'); } finally { setUploading(false); }
  };

  const handleProcess = async () => {
    if (!activePdf?.id) return toast.error('No uploaded file');
    setProcessing(true);
    try {
      const res = await pdfAPI.process(activePdf.id);
      setPdfData(res.data);
      toast.success('PDF processed');
    } catch { toast.error('Failed to process PDF'); } finally { setProcessing(false); }
  };

  const sections = result ? sectionDefs.filter(s => result[s.key]) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">AI Reviewer Generator</h1>
          <p className="text-white/70 mb-6">Generate comprehensive study materials on any STEM topic</p>

          <div className="flex gap-2 mb-4">
            <button onClick={() => { setTab('text'); setFile(null); setPdfData(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'text' ? 'bg-white text-sky-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Type Topic</button>
            <button onClick={() => { setTab('pdf'); setTopic(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'pdf' ? 'bg-white text-sky-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Upload PDF</button>
          </div>

          {tab === 'text' ? (
            <>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Newton's Laws of Motion, Photosynthesis, Calculus..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {topicSuggestions.map((s) => (
                  <button key={s.label} onClick={() => setTopic(s.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs transition-all"
                  ><span>{s.icon}</span>{s.label}</button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-white bg-white/10 scale-[1.02]' :
                  file ? 'border-green-400 bg-green-400/10' : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                }`}>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                <p className="text-3xl mb-1">{file ? '📄' : dragOver ? '📥' : '📤'}</p>
                {file ? (
                  <div><p className="text-sm font-medium text-green-300">{file.name}</p><p className="text-xs text-white/50 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
                ) : (
                  <div><p className="text-sm font-medium">Drop your PDF here</p><p className="text-xs text-white/50 mt-1">or click to browse</p></div>
                )}
              </div>
              {file && !activePdf && (
                <button onClick={handleUpload} disabled={uploading}
                  className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium disabled:opacity-50 transition-all">
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              )}
              {activePdf && !pdfData && (
                <button onClick={handleProcess} disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium disabled:opacity-50 transition-all">
                  {processing ? 'Processing...' : 'Process PDF'}
                </button>
              )}
              {pdfData && (
                <div className="bg-white/10 rounded-xl p-3 text-sm text-white/80">
                  <p className="font-medium text-white mb-1">PDF ready</p>
                  <p className="text-white/50 text-xs truncate">{file?.name || activePdf?.filename}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Review Type</h2>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg font-medium capitalize">{type}</span>
        </div>
        <ReviewTypeCard type={type} onTypeChange={setType} />
        <button onClick={tab === 'pdf' && pdfData ? handleGenerateFromPdf : handleGenerate}
          disabled={loading || (tab === 'text' ? !topic.trim() : !pdfData)}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Generating...' : `Generate Reviewer${tab === 'pdf' ? ' from PDF' : ''}`}
        </button>
      </motion.div>

      {loading && (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold">Generating your reviewer...</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Crafting personalized study materials</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold gradient-text">Generated Content</h2>
              <p className="text-sm text-[var(--text-secondary)]">{sections.length} sections</p>
            </div>
            <button onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-sky-500/10 text-sm font-medium border border-[var(--glass-border)] transition-all">Copy</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sections.map((section) => (
              <SectionCard key={section.key} sectionKey={section.key} icon={section.icon} title={section.title} content={result[section.key]} />
            ))}
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <button onClick={fetchHistory} className="text-sm text-sky-500 hover:text-sky-400 font-medium transition-colors">Refresh</button>
        </div>
        <HistoryList history={history} loading={historyLoading} onRefresh={fetchHistory} onSelect={handleSelectReviewer} />
      </motion.div>
    </div>
  );
};

export default Reviewer;