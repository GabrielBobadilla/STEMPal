import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiCamera, FiFileText, FiTrash2, FiEdit2, FiDownload, FiUpload, FiPlus, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import Scanner from '../components/scan/Scanner';
import { pdfAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ScanFile = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [renameMode, setRenameMode] = useState(false);
  const [fileName, setFileName] = useState('Scanned_Document');
  const [uploading, setUploading] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [recentScans, setRecentScans] = useState([]);

  const handleCapture = useCallback((dataUrl) => {
    setPages(prev => [...prev, dataUrl]);
    setCurrentPage(pages.length);
    setShowScanner(false);
    toast.success('Page captured');
  }, [pages.length]);

  const handleDeletePage = (idx) => {
    setPages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (currentPage >= next.length && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
      return next;
    });
    toast.info('Page removed');
  };

  const handleUpload = async () => {
    if (pages.length === 0) return toast.error('No pages to upload');
    setUploading(true);
    try {
      const formData = new FormData();
      const pdfBlob = await generatePdf(pages);
      formData.append('pdf', pdfBlob, `${fileName}.pdf`);
      formData.append('original_name', fileName);
      await pdfAPI.upload(formData);
      toast.success('Document uploaded successfully!');
      setRecentScans(prev => [{ name: fileName, pages: pages.length, date: new Date().toLocaleString() }, ...prev].slice(0, 10));
      setPages([]);
      setCurrentPage(0);
      setFileName('Scanned_Document');
    } catch (err) {
      toast.error('Upload failed. Make sure the file is a valid PDF.');
    } finally {
      setUploading(false);
    }
  };

  const generatePdf = async (imageDataUrls) => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < imageDataUrls.length; i++) {
      if (i > 0) pdf.addPage();
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
          const w = imgWidth * ratio;
          const h = imgHeight * ratio;
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

  const handleDownload = async () => {
    if (pages.length === 0) return;
    const blob = await generatePdf(pages);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-3xl mx-auto">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Scan Document</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Capture documents using your camera and upload as PDF</p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setShowScanner(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <FiCamera className="w-4 h-4" /> Scan Page
          </motion.button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[var(--text-secondary)]">Export:</span>
            <button onClick={() => setExportFormat('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${exportFormat === 'pdf' ? 'gradient-bg text-white' : 'glass'}`}>
              <FiFileText className="w-3.5 h-3.5 inline mr-1" /> PDF
            </button>
            <button onClick={() => setExportFormat('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${exportFormat === 'image' ? 'gradient-bg text-white' : 'glass'}`}>
              <FiImage className="w-3.5 h-3.5 inline mr-1" /> Image
            </button>
          </div>
        </div>

        {showScanner && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Scanner onCapture={handleCapture} onClose={() => setShowScanner(false)} />
          </motion.div>
        )}
      </motion.div>

      {pages.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {renameMode ? (
                <input value={fileName} onChange={e => setFileName(e.target.value)}
                  className="input-field text-lg font-bold py-1 px-2 w-48" autoFocus
                  onBlur={() => setRenameMode(false)} onKeyDown={e => e.key === 'Enter' && setRenameMode(false)} />
              ) : (
                <h2 className="text-lg font-bold flex items-center gap-2 cursor-pointer" onClick={() => setRenameMode(true)}>
                  <FiEdit2 className="w-4 h-4 text-primary-500" />
                  {fileName}
                </h2>
              )}
              <span className="badge-primary text-xs">{pages.length} page{pages.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">{currentPage + 1}/{pages.length}</span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black/50 mb-4">
            <img src={pages[currentPage]} alt={`Page ${currentPage + 1}`}
              className="w-full max-h-[400px] object-contain mx-auto" />
            {pages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage >= pages.length - 1}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white disabled:opacity-30">
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
            {pages.map((page, idx) => (
              <div key={idx}
                className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  idx === currentPage ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-transparent hover:border-primary-300'
                }`}
                onClick={() => setCurrentPage(idx)}>
                <img src={page} alt="" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); handleDeletePage(idx); }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                  <FiTrash2 className="w-2.5 h-2.5" />
                </button>
                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white">{idx + 1}</span>
              </div>
            ))}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowScanner(true)}
              className="flex-shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-primary-500 hover:text-primary-500 transition-all">
              <FiPlus className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleDownload}
              className="btn-secondary flex items-center gap-2 text-sm">
              <FiDownload className="w-4 h-4" /> Preview PDF
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpload} disabled={uploading}
              className="btn-primary flex items-center gap-2 text-sm">
              {uploading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" /> Uploading...</>
              ) : (
                <><FiUpload className="w-4 h-4" /> Upload to STEMPal</>
              )}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPages([]); setCurrentPage(0); }}
              className="btn-secondary text-sm text-red-400">
              <FiTrash2 className="w-4 h-4 inline mr-1" /> Clear All
            </motion.button>
          </div>
        </motion.div>
      )}

      {pages.length === 0 && !showScanner && (
        <motion.div variants={itemVariants} className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">No Pages Yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Tap "Scan Page" to capture a document with your camera</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowScanner(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm">
            <FiCamera className="w-4 h-4" /> Scan a Page
          </motion.button>
        </motion.div>
      )}

      {recentScans.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
          <div className="space-y-2">
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
                <span className="font-medium">{scan.name}</span>
                <div className="text-right text-xs text-[var(--text-secondary)]">
                  <div>{scan.pages} pages</div>
                  <div>{scan.date}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScanFile;