import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiCheck, FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi';
import { preferenceAPI, streakAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const durations = [
  { value: '30min', label: '30 Minutes' },
  { value: '1hour', label: '1 Hour' },
  { value: '2hours', label: '2 Hours' },
  { value: '3plus', label: '3+ Hours' },
];
const styles = [
  { value: 'visual', label: 'Visual', desc: 'Diagrams & videos' },
  { value: 'reading', label: 'Reading', desc: 'Text & articles' },
  { value: 'practice', label: 'Practice', desc: 'Exercises & problems' },
  { value: 'mixed', label: 'Mixed', desc: 'All of the above' },
];
const breakActivities = ['Stretching', 'Walking', 'Music', 'Drawing', 'Reading', 'Gaming', 'Meditation', 'Water Break'];

const Preferences = () => {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    grade_level: '', school: '', stem_strand: '',
    subjects: [], study_duration: '', learning_style: '',
    hobbies: '', preferred_breaks: [], study_goals: '',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { checkPreferences } = useAuth();

  const toggleArrayItem = (field, item) => {
    setPrefs(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
    }));
  };

  const handleSave = async () => {
    if (prefs.subjects.length === 0) return toast.error('Please select at least one subject');
    if (!prefs.study_duration) return toast.error('Please select study duration');
    if (!prefs.learning_style) return toast.error('Please select learning style');

    setSaving(true);
    try {
      const hobbiesArray = prefs.hobbies
        ? prefs.hobbies.split(',').map(h => h.trim()).filter(Boolean)
        : [];
      await preferenceAPI.save({
        subjects: prefs.subjects,
        hobbies: hobbiesArray,
        learning_style: prefs.learning_style,
        study_duration: prefs.study_duration,
        preferred_break: prefs.preferred_breaks,
        study_goals: prefs.study_goals,
        grade_level: prefs.grade_level,
        school: prefs.school,
        stem_strand: prefs.stem_strand,
      });
      await streakAPI.update();
      await checkPreferences();
      toast.success('Preferences saved!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'Welcome to STEMPal!',
      subtitle: "Let's personalize your learning experience",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Grade Level</label>
            <input value={prefs.grade_level} onChange={e => setPrefs(p => ({ ...p, grade_level: e.target.value }))} placeholder="e.g., Grade 11, College Freshman" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">School</label>
            <input value={prefs.school} onChange={e => setPrefs(p => ({ ...p, school: e.target.value }))} placeholder="Your school name" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">STEM Strand</label>
            <input value={prefs.stem_strand} onChange={e => setPrefs(p => ({ ...p, stem_strand: e.target.value }))} placeholder="e.g., Engineering, Health Sciences" className="input-field" />
          </div>
        </div>
      ),
    },
    {
      title: 'Favorite Subjects',
      subtitle: 'Select the STEM subjects you enjoy most',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map(s => (
            <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => toggleArrayItem('subjects', s)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                prefs.subjects.includes(s) ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-[var(--glass-border)] hover:border-primary-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{s === 'Mathematics' && '📐 '}{s === 'Physics' && '⚛️ '}{s === 'Chemistry' && '🧪 '}{s === 'Biology' && '🧬 '}{s === 'Computer Science' && '💻 '}{s}</span>
                {prefs.subjects.includes(s) && <FiCheck className="w-5 h-5" />}
              </div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'Study Preferences',
      subtitle: 'How long do you usually study?',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {durations.map(d => (
              <motion.button key={d.value} whileTap={{ scale: 0.97 }} onClick={() => setPrefs(p => ({ ...p, study_duration: d.value }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  prefs.study_duration === d.value ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--glass-border)] hover:border-primary-300'
                }`}
              >
                <span className="font-medium">{d.label}</span>
              </motion.button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">Learning Style</label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map(s => (
                <motion.button key={s.value} whileTap={{ scale: 0.97 }} onClick={() => setPrefs(p => ({ ...p, learning_style: s.value }))}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    prefs.learning_style === s.value ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--glass-border)] hover:border-primary-300'
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">{s.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Break & Goals',
      subtitle: 'What do you enjoy during breaks?',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {breakActivities.map(b => (
              <motion.button key={b} whileTap={{ scale: 0.97 }} onClick={() => toggleArrayItem('preferred_breaks', b)}
                className={`p-3 rounded-xl border-2 text-sm transition-all ${
                  prefs.preferred_breaks.includes(b) ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--glass-border)] hover:border-primary-300'
                }`}
              >
                {b}
              </motion.button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hobbies</label>
            <input value={prefs.hobbies} onChange={e => setPrefs(p => ({ ...p, hobbies: e.target.value }))} placeholder="e.g., Drawing, Playing guitar, Cooking" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Study Goals</label>
            <textarea value={prefs.study_goals} onChange={e => setPrefs(p => ({ ...p, study_goals: e.target.value }))} placeholder="What do you want to achieve this semester?" rows={3} className="input-field min-h-[100px]" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className={`absolute ${i === 1 ? '-top-40 -right-40 w-[500px] h-[500px]' : i === 2 ? '-bottom-40 -left-40 w-[450px] h-[450px]' : 'top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px]'} bg-white/10 rounded-full`} />
      ))}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-6">Step {step + 1} of {steps.length}</div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <h2 className="text-xl font-bold mb-1">{steps[step].title}</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">{steps[step].subtitle}</p>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="btn-secondary flex items-center gap-1 disabled:opacity-50">
            <FiChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-1">
              Next <FiChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1 disabled:opacity-70">
              {saving ? 'Saving...' : <><FiZap className="w-4 h-4" /> Complete Setup</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Preferences;