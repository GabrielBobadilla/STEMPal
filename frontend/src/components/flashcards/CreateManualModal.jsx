import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { flashcardAPI } from '../../services/api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const CreateManualModal = ({ show, onClose, defaultTopic, onCreate }) => {
  const [form, setForm] = useState({ question: '', answer: '', topic: defaultTopic || '', difficulty: 'medium' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.question || !form.answer || !form.topic) return;
    setCreating(true);
    try {
      await flashcardAPI.create(form);
      onCreate?.();
      onClose();
      setForm({ question: '', answer: '', topic: defaultTopic || '', difficulty: 'medium' });
    } catch {
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">Create Flashcard</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={3} placeholder="Enter your question..." className="input-field w-full resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={3} placeholder="Enter the answer..." className="input-field w-full resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <input type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g., Biology, History..." className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <div className="flex gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                      className={`flex-1 p-2.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                        form.difficulty === d ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-white/10 hover:border-white/20'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={!form.question || !form.answer || !form.topic || creating} className="btn-primary w-full py-3 mt-2">
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : 'Create Flashcard'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateManualModal;
