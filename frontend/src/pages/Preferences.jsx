import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
const breakActivities = ['Stretching', 'Walking', 'Music', 'Drawing', 'Reading', 'Gaming', 'Meditation', 'Water Break', 'Other (Type Your Own)'];

const Preferences = () => {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    grade_level: '', school: '', stem_strand: '',
    subjects: [], study_duration: '', learning_style: '',
    hobbies: '', preferred_breaks: [], study_goals: '',
    custom_break: '',
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
      const breaks = [...prefs.preferred_breaks];
      if (prefs.custom_break && prefs.preferred_breaks.includes('Other (Type Your Own)')) {
        const idx = breaks.indexOf('Other (Type Your Own)');
        breaks[idx] = prefs.custom_break;
      }
      await preferenceAPI.save({
        subjects: prefs.subjects,
        hobbies: hobbiesArray,
        learning_style: prefs.learning_style,
        study_duration: prefs.study_duration,
        preferred_break: breaks,
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
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Break Activities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {breakActivities.map(b => (
                <motion.button key={b} whileTap={{ scale: 0.97 }} onClick={() => {
                  if (b === 'Other (Type Your Own)') {
                    if (prefs.preferred_breaks.includes('Other (Type Your Own)')) {
                      toggleArrayItem('preferred_breaks', 'Other (Type Your Own)');
                      setPrefs(p => ({ ...p, custom_break: '' }));
                    } else {
                      toggleArrayItem('preferred_breaks', 'Other (Type Your Own)');
                    }
                  } else {
                    toggleArrayItem('preferred_breaks', b);
                  }
                }}
                  className={`p-3 rounded-xl border-2 text-sm transition-all ${
                    prefs.preferred_breaks.includes(b) ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--glass-border)] hover:border-primary-300'
                  }`}
                >
                  {b === 'Other (Type Your Own)' ? '✏️ Other' : b}
                </motion.button>
              ))}
            </div>
            {prefs.preferred_breaks.includes('Other (Type Your Own)') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                <input value={prefs.custom_break || ''} onChange={e => setPrefs(p => ({ ...p, custom_break: e.target.value }))} placeholder="Type your own break activity..." className="input-field" />
              </motion.div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hobbies</label>
            <input value={prefs.hobbies} onChange={e => setPrefs(p => ({ ...p, hobbies: e.target.value }))} placeholder="e.g., Drawing, Playing guitar, Cooking" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Study Goals</label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Choose a preset or type your own</span>
            </div>
            <textarea value={prefs.study_goals} onChange={e => setPrefs(p => ({ ...p, study_goals: e.target.value }))} placeholder="What do you want to achieve this semester?" rows={3} className="input-field min-h-[100px]" />
          </div>
        </div>
      ),
    },
  ];

const shapes = [
  { type: 'triangle', size: 80, x: '10%', y: '20%', dur: 8, delay: 0, rot: 45 },
  { type: 'square', size: 60, x: '85%', y: '15%', dur: 10, delay: 0.5, rot: 30 },
  { type: 'hexagon', size: 90, x: '75%', y: '70%', dur: 12, delay: 1, rot: 60 },
  { type: 'diamond', size: 50, x: '20%', y: '75%', dur: 9, delay: 0.8, rot: 0 },
  { type: 'triangle', size: 100, x: '50%', y: '5%', dur: 11, delay: 1.5, rot: 90 },
  { type: 'square', size: 70, x: '5%', y: '45%', dur: 7, delay: 0.3, rot: 15 },
  { type: 'diamond', size: 65, x: '90%', y: '50%', dur: 13, delay: 1.2, rot: 45 },
  { type: 'hexagon', size: 40, x: '35%', y: '80%', dur: 14, delay: 0.7, rot: 20 },
  { type: 'triangle', size: 55, x: '60%', y: '85%', dur: 8, delay: 2, rot: 120 },
  { type: 'diamond', size: 35, x: '40%', y: '10%', dur: 15, delay: 0.4, rot: 60 },
  { type: 'square', size: 45, x: '70%', y: '40%', dur: 10, delay: 1.8, rot: 80 },
  { type: 'triangle', size: 30, x: '25%', y: '35%', dur: 6, delay: 2.2, rot: 10 },
];

const particles = Array.from({ length: 40 }, (_, i) => ({
  size: Math.random() * 6 + 3,
  x: `${Math.random() * 100}%`,
  dur: Math.random() * 6 + 4,
  delay: Math.random() * 4,
}));

const lines = [
  { x1: 0, y1: 30, x2: 25, y2: 10, delay: 0 },
  { x1: 75, y1: 0, x2: 100, y2: 20, delay: 1 },
  { x1: 0, y1: 70, x2: 30, y2: 60, delay: 2 },
  { x1: 70, y1: 80, x2: 100, y2: 65, delay: 1.5 },
  { x1: 10, y1: 0, x2: 15, y2: 30, delay: 0.5 },
  { x1: 80, y1: 30, x2: 95, y2: 50, delay: 2.5 },
];

function getClipPath(type) {
  switch (type) {
    case 'triangle': return 'polygon(50% 0%,0% 100%,100% 100%)';
    case 'hexagon': return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    case 'diamond': return 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)';
    default: return 'none';
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 25%, #60A5FA 50%, #38BDF8 75%, #BFDBFE 100%)' }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
        {lines.map((l, i) => (
          <motion.line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke="white" strokeWidth="2.5" strokeLinecap="round" filter="url(#prefGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 5, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
        <defs>
          <filter id="prefGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {shapes.map((s, i) => (
        <motion.div key={i} className="absolute"
          style={{
            width: s.size, height: s.size,
            clipPath: getClipPath(s.type),
            background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: s.type === 'square' ? '6px' : '0',
            boxShadow: '0 0 20px rgba(255,255,255,0.15)',
          }}
          initial={{ x: s.x, y: s.y, rotate: s.rot, opacity: 0, scale: 0.3 }}
          animate={{
            x: [s.x, `calc(${s.x} + ${120 + i * 15}px)`, `calc(${s.x} - ${80 + i * 8}px)`, s.x],
            y: [s.y, `calc(${s.y} - ${100 + i * 12}px)`, `calc(${s.y} + ${130 + i * 10}px)`, s.y],
            rotate: [s.rot, s.rot + 360, s.rot + 720],
            opacity: [0, 0.9, 0.5, 0.9, 0],
            scale: [0.3, 1.1, 0.7, 1.1, 0.3],
          }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {particles.map((p, i) => (
        <motion.div key={`p${i}`} className="absolute rounded-full"
          style={{
            width: p.size, height: p.size, left: p.x,
            background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
            boxShadow: '0 0 6px rgba(255,255,255,0.4)',
          }}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: ['110%', '-10%'], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }} />
      ))}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.1, 1], opacity: [0, 0.18, 0.12, 0.18] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white rounded-full" />
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.15, 1], opacity: [0, 0.15, 0.08, 0.15] }}
        transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-sky-300 rounded-full" />
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.2, 1], opacity: [0, 0.12, 0.06, 0.12] }}
        transition={{ duration: 4, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-200 rounded-full" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl glass-modal p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mb-6">Step {step + 1} of {steps.length}</div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <h2 className="text-xl font-bold mb-1">{steps[step].title}</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">{steps[step].subtitle}</p>
            {steps[step].content}
          </motion.div>

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