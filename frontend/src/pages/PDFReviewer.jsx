import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { pdfAPI, reviewerAPI, flashcardAPI, quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const reviewerTypes = [
  { value: 'basic', label: 'Short Reviewer', icon: '📋', desc: 'Concise summary' },
  { value: 'detailed', label: 'Detailed Reviewer', icon: '📚', desc: 'Comprehensive material' },
  { value: 'exam', label: 'Exam Reviewer', icon: '🎯', desc: 'Practice questions included' },
];

const generateOptions = [
  { value: 'reviewer', label: 'Generate Reviewer', icon: '🤖', color: 'from-sky-500 to-cyan-500' },
  { value: 'flashcards', label: 'Generate Flashcards', icon: '🎴', color: 'from-sky-500 to-cyan-500' },
  { value: 'quiz', label: 'Generate Quiz', icon: '📝', color: 'from-green-500 to-emerald-500' },
];

const PDFReviewer = () => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [reviewerType, setReviewerType] = useState('detailed');
  const [pdfData, setPdfData] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activePdf, setActivePdf] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await pdfAPI.getAll();
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type === 'application/pdf' || selected.name.endsWith('.pdf')) {
        setFile(selected);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setUploading(true);
    setPdfData(null);
    setActivePdf(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await pdfAPI.upload(formData);
      setActivePdf(res.data);
      toast.success('File uploaded successfully');
      fetchHistory();
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!activePdf?.id) return toast.error('No uploaded file to process');
    setProcessing(true);
    try {
      const res = await pdfAPI.process(activePdf.id);
      setPdfData(res.data);
      toast.success('PDF processed successfully');
    } catch {
      toast.error('Failed to process PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async (option) => {
    if (!activePdf?.id) return toast.error('No processed PDF available');
    setGenerating(option);
    try {
      const payload = {
        pdfId: activePdf.id,
        content: pdfData?.extracted_text || pdfData?.content,
        reviewer_type: reviewerType,
      };
      let res;
      switch (option) {
        case 'reviewer':
          res = await reviewerAPI.generate({ ...payload, topic: pdfData?.title || 'PDF Content' });
          setResult(res?.data);
          toast.success('Reviewer generated from PDF');
          break;
        case 'flashcards':
          res = await flashcardAPI.generate(payload);
          toast.success('Flashcards generated from PDF');
          break;
        case 'quiz':
          res = await quizAPI.generate(payload);
          toast.success('Quiz generated from PDF');
          break;
        default:
          break;
      }
      return res?.data;
    } catch {
      toast.error(`Failed to generate ${option}`);
    } finally {
      setGenerating(null);
    }
  };

  const formatContent = (text) => {
    if (!text) return null;
    return text.split('\n').filter(Boolean).map((p, i) => (
      <p key={i} className="mb-2 leading-relaxed">{p}</p>
    ));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">📄 PDF Reviewer Generator</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Upload PDFs to generate study materials</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Upload & Configure</h2>
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
                  : file
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-[var(--glass-border)] hover:border-primary-400 hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-3xl mb-2">{file ? '📄' : dragOver ? '📥' : '📤'}</p>
              {file ? (
                <div>
                  <p className="text-sm font-medium text-green-500">{file.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Drop your PDF here</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">or click to browse</p>
                </div>
              )}
            </div>

            {file && !activePdf && (
              <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Uploading...</>
                ) : (
                  '📤 Upload PDF'
                )}
              </button>
            )}

            {activePdf && !processing && !pdfData && (
              <button onClick={handleProcess} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {processing ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Processing...</>
                ) : (
                  '⚙️ Process PDF'
                )}
              </button>
            )}

            {pdfData && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Reviewer Type</label>
                  <div className="space-y-2">
                    {reviewerTypes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setReviewerType(t.value)}
                        className={`w-full p-3 rounded-xl border transition-all text-left ${
                          reviewerType === t.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{t.label}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{t.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-2">Generate Study Materials</h3>
                <div className="space-y-2">
                  {generateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleGenerate(opt.value)}
                      disabled={generating === opt.value}
                      className={`w-full p-3 rounded-xl bg-gradient-to-br ${opt.color} text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                      {generating === opt.value ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <span className="text-lg">{opt.icon}</span>
                      )}
                      <span className="text-sm font-medium">{generating === opt.value ? 'Generating...' : opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2 min-h-[400px]">
          {(uploading || processing) ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-4 animate-pulse text-3xl">
                ✨
              </div>
              <p className="text-[var(--text-secondary)]">{uploading ? 'Uploading file...' : 'AI is analyzing your document...'}</p>
            </div>
          ) : generating ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mb-4" />
              <p className="text-[var(--text-secondary)]">Generating study materials...</p>
            </div>
          ) : result ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{result.title || 'Generated Reviewer'}</h2>
                <button onClick={() => {
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Reviewer</title><style>body{font-family:sans-serif;padding:2rem;max-width:800px;margin:auto;line-height:1.6}h2{color:#7c3aed}</style></head><body>${(result.full_content || result.content || '').replace(/\n/g, '<br>')}</body></html>`);
                  win.document.close(); win.print();
                }} className="btn-secondary text-sm px-3 py-1.5">
                  🖨️ Print
                </button>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.full_content || result.content || ''}
              </div>
            </div>
          ) : pdfData ? (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📄</span> {pdfData.title || 'Extracted Content'}
              </h2>
              <div className="max-h-96 overflow-y-auto text-sm leading-relaxed">
                {formatContent(pdfData.extracted_text || pdfData.content || 'No content extracted')}
              </div>
              {pdfData.organized_content && (
                <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                  <h3 className="font-semibold mb-3">Organized Content</h3>
                  <div className="grid gap-3">
                    {Object.entries(pdfData.organized_content).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs font-semibold text-primary-500 uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <p className="text-5xl mb-3">📚</p>
              <p className="text-[var(--text-secondary)]">Upload a file to get started</p>
              <p className="text-xs text-[var(--text-secondary)]/60 mt-1">PDF files supported</p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload History</h2>
          <button onClick={fetchHistory} className="text-sm text-primary-500 hover:underline">Refresh</button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">No PDFs uploaded yet</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-[var(--bg-secondary)] cursor-pointer hover:bg-primary-500/5 transition-colors"
                onClick={() => { setActivePdf(item); setPdfData(null); setResult(null); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium">{item.filename || item.title || 'Untitled PDF'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.status || 'uploaded'} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-sky-500/20 text-sky-400'
                  }`}>
                    {item.status || 'uploaded'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PDFReviewer;
