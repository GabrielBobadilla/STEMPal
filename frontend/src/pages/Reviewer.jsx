import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { reviewerAPI, pdfAPI, flashcardAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiCamera, FiFileText, FiImage, FiTrash2, FiChevronLeft, FiChevronRight, FiPlus, FiUpload, FiDownload, FiEdit2 } from 'react-icons/fi';
import Scanner from '../components/scan/Scanner';
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

  const [showScanner, setShowScanner] = useState(false);
  const [scanPages, setScanPages] = useState([]);
  const [currentScanPage, setCurrentScanPage] = useState(0);
  const [scanFileName, setScanFileName] = useState('Scanned_Document');
  const [renameMode, setRenameMode] = useState(false);
  const [scanUploading, setScanUploading] = useState(false);
  const [scanPdfData, setScanPdfData] = useState(null);
  const [scanActivePdf, setScanActivePdf] = useState(null);

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
    const sourceData = pdfData || scanPdfData;
    if (!sourceData) return toast.error('No PDF content available');
    setLoading(true);
    setResult(null);
    try {
      const title = sourceData.title || sourceData.filename || topic || 'Scanned Content';
      const res = await reviewerAPI.generate({ topic: title, type, content: sourceData.extracted_text || sourceData.content });
      setResult(res.data.content);
      toast.success('Reviewer generated');
      fetchHistory();
    } catch { toast.error('Failed to generate reviewer'); } finally { setLoading(false); }
  };

  const handleSelectReviewer = async (item) => {
    try {
      const res = await reviewerAPI.get(item.id);
      setResult(res.data.content || res.data);
    } catch { toast.error('Failed to load reviewer'); }
  };

  const navigate = useNavigate();

  const handleGenerateFlashcards = async () => {
    const topicToUse = topic || result?.topic || (activePdf?.filename || scanActivePdf?.filename || '');
    if (!topicToUse) return toast.error('No topic available');
    setLoading(true);
    try {
      await flashcardAPI.generate({ topic: topicToUse, count: 10 });
      toast.success('Flashcards generated!');
      navigate('/flashcards');
    } catch { toast.error('Failed to generate flashcards'); } finally { setLoading(false); }
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
      fd.append('pdf', file);
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

  const generatePdfFromImages = async (imageDataUrls) => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < imageDataUrls.length; i++) {
      if (i > 0) pdf.addPage();
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;
          pdf.addImage(imageDataUrls[i], 'JPEG', x, y, w, h);
          resolve();
        };
        img.src = imageDataUrls[i];
      });
    }
    return pdf.output('blob');
  };

  const handleScanCapture = useCallback((dataUrl) => {
    setScanPages(prev => [...prev, dataUrl]);
    setCurrentScanPage(scanPages.length);
    setShowScanner(false);
    toast.success('Page captured');
  }, [scanPages.length]);

  const handleDeleteScanPage = (idx) => {
    setScanPages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (currentScanPage >= next.length && currentScanPage > 0) setCurrentScanPage(currentScanPage - 1);
      return next;
    });
    toast.info('Page removed');
  };

  const handleScanUpload = async () => {
    if (scanPages.length === 0) return toast.error('No pages to upload');
    setScanUploading(true);
    setScanPdfData(null);
    setScanActivePdf(null);
    setResult(null);
    try {
      const pdfBlob = await generatePdfFromImages(scanPages);
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${scanFileName}.pdf`);
      formData.append('original_name', scanFileName);
      const res = await pdfAPI.upload(formData);
      setScanActivePdf(res.data);
      toast.success('Scanned document uploaded');

      setProcessing(true);
      try {
        const procRes = await pdfAPI.process(res.data.id);
        setScanPdfData(procRes.data);
        toast.success('PDF processed - ready to generate reviewer');
      } catch { toast.error('Failed to process scanned PDF'); } finally { setProcessing(false); }
    } catch (err) {
      toast.error('Upload failed');
    } finally { setScanUploading(false); }
  };

  const handleScanProcess = async () => {
    if (!scanActivePdf?.id) return toast.error('No uploaded file');
    setProcessing(true);
    try {
      const res = await pdfAPI.process(scanActivePdf.id);
      setScanPdfData(res.data);
      toast.success('PDF processed');
    } catch { toast.error('Failed to process PDF'); } finally { setProcessing(false); }
  };

  const isScanReady = !!scanPdfData;
  const isPdfReady = !!pdfData;
  const canGenerate = (tab === 'text' && topic.trim()) || (tab === 'pdf' && isPdfReady) || (tab === 'scan' && isScanReady);

  const sections = result ? sectionDefs.filter(s => result[s.key]) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-[#60C5FF] to-[#0EA5E9] p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">AI Reviewer Generator</h1>
          <p className="text-white/70 mb-6">Generate comprehensive study materials on any STEM topic</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => { setTab('text'); setFile(null); setPdfData(null); setActivePdf(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'text' ? 'bg-white text-sky-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Type Topic</button>
            <button onClick={() => { setTab('pdf'); setTopic(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'pdf' ? 'bg-white text-sky-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Upload PDF</button>
            <button onClick={() => { setTab('scan'); setTopic(''); setFile(null); setPdfData(null); setActivePdf(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'scan' ? 'bg-white text-sky-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Scan Document</button>
          </div>

          {tab === 'text' && (
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
          )}

          {tab === 'pdf' && (
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

          {tab === 'scan' && (
            <div className="space-y-3">
              {showScanner && (
                <div className="mb-2">
                  <Scanner onCapture={handleScanCapture} onClose={() => setShowScanner(false)} />
                </div>
              )}

              {!showScanner && scanPages.length === 0 && (
                <button onClick={() => setShowScanner(true)}
                  className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all border border-white/20 hover:border-white/40">
                  <FiCamera className="w-5 h-5" /> Scan a Page
                </button>
              )}

              {!showScanner && scanPages.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renameMode ? (
                        <input value={scanFileName} onChange={e => setScanFileName(e.target.value)}
                          className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 text-sm w-40 outline-none"
                          autoFocus onBlur={() => setRenameMode(false)}
                          onKeyDown={e => e.key === 'Enter' && setRenameMode(false)} />
                      ) : (
                        <span className="text-sm font-medium flex items-center gap-1 cursor-pointer hover:text-white/80" onClick={() => setRenameMode(true)}>
                          <FiEdit2 className="w-3 h-3" /> {scanFileName}
                        </span>
                      )}
                      <span className="text-xs text-white/50">{scanPages.length} page{scanPages.length > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-white/50">{currentScanPage + 1}/{scanPages.length}</span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-black/50">
                    <img src={scanPages[currentScanPage]} alt={`Page ${currentScanPage + 1}`}
                      className="w-full max-h-[250px] object-contain mx-auto" />
                    {scanPages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        <button onClick={() => setCurrentScanPage(p => Math.max(0, p - 1))} disabled={currentScanPage === 0}
                          className="w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
                          <FiChevronLeft className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCurrentScanPage(p => Math.min(scanPages.length - 1, p + 1))} disabled={currentScanPage >= scanPages.length - 1}
                          className="w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
                          <FiChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {scanPages.map((page, idx) => (
                      <div key={idx}
                        className={`relative flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          idx === currentScanPage ? 'border-white ring-2 ring-white/30' : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => setCurrentScanPage(idx)}>
                        <img src={page} alt="" className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteScanPage(idx); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                          <FiTrash2 className="w-2.5 h-2.5" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-white">{idx + 1}</span>
                      </div>
                    ))}
                    <button onClick={() => setShowScanner(true)}
                      className="flex-shrink-0 w-12 h-16 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 hover:border-white/50 hover:text-white/80 transition-all">
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleScanUpload} disabled={scanUploading}
                      className="flex-1 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      {scanUploading ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" /> Uploading...</>
                      ) : (
                        <><FiUpload className="w-4 h-4" /> Upload & Process</>
                      )}
                    </button>
                    <button onClick={() => { setScanPages([]); setCurrentScanPage(0); setScanPdfData(null); setScanActivePdf(null); }}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-all">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {scanPdfData && (
                    <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-sm text-green-300">
                      <p className="font-medium mb-0.5">Scanned content ready</p>
                      <p className="text-white/50 text-xs">Click "Generate Reviewer" below to create study materials</p>
                    </div>
                  )}
                </>
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
        <button onClick={tab === 'text' ? handleGenerate : handleGenerateFromPdf}
          disabled={loading || !canGenerate}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#60C5FF] to-[#38BDF8] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Generating...' : `Generate Reviewer${tab === 'pdf' ? ' from PDF' : tab === 'scan' ? ' from Scan' : ''}`}
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
            <div className="flex gap-2">
              <button onClick={handleGenerateFlashcards}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#60C5FF] to-[#38BDF8] text-white text-sm font-medium transition-all hover:shadow-lg">Generate Flashcards</button>
              <button onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-sky-500/10 text-sm font-medium border border-[var(--glass-border)] transition-all">Copy</button>
            </div>
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
