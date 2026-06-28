import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pomodoroAPI, breakAPI } from '../services/api';
import { toast } from 'react-toastify';
import CircularTimer from '../components/pomodoro/CircularTimer';
import PhaseLabel from '../components/pomodoro/PhaseLabel';
import FocusScoreInput from '../components/pomodoro/FocusScoreInput';
import AdaptiveSettingsPanel from '../components/pomodoro/AdaptiveSettingsPanel';
import SessionStats from '../components/pomodoro/SessionStats';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const playNotification = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    }, 200);
  } catch {}
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Pomodoro = () => {
  const [mode, setMode] = useState('traditional');
  const [phase, setPhase] = useState('study');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalSessions] = useState(4);
  const [focusScore, setFocusScore] = useState(75);
  const [showFocusInput, setShowFocusInput] = useState(false);
  const [adaptiveSettings, setAdaptiveSettings] = useState(null);
  const [adaptiveData, setAdaptiveData] = useState(null);
  const [totalStudy, setTotalStudy] = useState(0);
  const [breakRec, setBreakRec] = useState(null);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const timerRef = useRef(null);

  const traditionalTimes = {
    study: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60
  };

  const getPhaseTime = (p) => {
    if (mode === 'adaptive' && adaptiveSettings) {
      if (p === 'study') return adaptiveSettings.study_duration * 60;
      if (p === 'longBreak') return adaptiveSettings.long_break_duration * 60;
      return adaptiveSettings.break_duration * 60;
    }
    return traditionalTimes[p] || 25 * 60;
  };

  const getAdaptiveStudyTime = useCallback(() => {
    if (mode === 'adaptive' && adaptiveSettings) return adaptiveSettings.study_duration || 25;
    if (focusScore > 85) return 35;
    if (focusScore >= 60) return 25;
    return 20;
  }, [mode, adaptiveSettings, focusScore]);

  const getBreakTime = useCallback(() => {
    if (mode === 'traditional') return sessionCount > 0 && (sessionCount + 1) % 4 === 0 ? 15 : 5;
    if (focusScore < 60) return 10;
    return 5;
  }, [mode, focusScore, sessionCount]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (mode === 'adaptive') fetchAdaptiveSettings();
  }, [mode]);

  useEffect(() => {
    if (mode === 'adaptive' && sessionCount > 0) getRecoverySuggestions();
  }, [sessionCount, mode]);

  useEffect(() => {
    const t = getPhaseTime(phase);
    if (!isRunning) { setTimeLeft(t); setTotalTime(t); }
  }, [phase, mode, adaptiveSettings]);

  const fetchAdaptiveSettings = async () => {
    try {
      const res = await pomodoroAPI.getAdaptiveSettings();
      const settings = res.data || {};
      setAdaptiveSettings(settings);
      if (!isRunning) { const t = (settings.study_duration || 25) * 60; setTimeLeft(t); setTotalTime(t); }
    } catch {
      toast.error('Failed to load adaptive settings, using defaults');
      setAdaptiveSettings(null);
    }
  };

  const startTimer = () => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    const t = getPhaseTime(phase);
    setTimeLeft(t);
    setTotalTime(t);
    setBreakRec(null);
  };

  const handlePhaseComplete = () => {
    playNotification();

    if (phase === 'study') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      setTotalStudy(t => t + getAdaptiveStudyTime());

      const studyDur = Math.floor((totalTime - timeLeft) / 60) || 1;
      pomodoroAPI.saveSession({
        study_duration: studyDur,
        break_duration: 0,
        sessions_completed: newCount,
        mode
      }).catch(() => {});

      if (mode === 'adaptive') {
        getBreakRecommendation();
        return;
      }

      if (newCount >= totalSessions) {
        setPhase('longBreak');
        const t = getPhaseTime('longBreak');
        setTimeLeft(t); setTotalTime(t);
        toast.info('☕ Long break! You earned it.');
      } else {
        setPhase('break');
        const t = getPhaseTime('break');
        setTimeLeft(t); setTotalTime(t);
        toast.info('☕ Break time!');
      }
    } else {
      if (mode === 'adaptive' && adaptiveSettings?.recovery_break_suggested) {
        toast.info('Recovery break recommended - consider a longer rest');
      }
      setPhase('study');
      const t = getPhaseTime('study');
      setTimeLeft(t); setTotalTime(t);
      toast.success('🚀 Break over! Ready to study again.');
    }
  };

  const getBreakRecommendation = async () => {
    setLoadingBreak(true);
    try {
      const res = await breakAPI.recommend({
        context: 'pomodoro',
        sessions_completed: sessionCount + 1,
        focus_score: focusScore,
        total_study: totalStudy + getAdaptiveStudyTime(),
      });
      setBreakRec(res.data);
      setPhase('break');
      const dur = (res.data?.duration || getBreakTime()) * 60;
      setTimeLeft(dur);
      setTotalTime(dur);
      toast.info(`☕ ${res.data?.activity || 'Break'} recommended`);
    } catch {
      setPhase('break');
      const t = getBreakTime() * 60;
      setTimeLeft(t);
      setTotalTime(t);
    }
    setLoadingBreak(false);
  };

  const getRecoverySuggestions = async () => {
    if (mode !== 'adaptive') return;
    try {
      const res = await breakAPI.recommend({ context: 'pomodoro', sessions_completed: sessionCount });
      setAdaptiveData(res.data);
    } catch {}
  };

  const handleSubmitFocusScore = async () => {
    try {
      await pomodoroAPI.saveFocusScore({ score: focusScore, session_type: phase === 'study' ? 'focus' : 'break' });
      toast.success('Focus score saved');
      setShowFocusInput(false);
      setFocusScore(75);
    } catch {
      toast.error('Failed to save focus score');
    }
  };

  const switchMode = (newMode) => {
    pauseTimer();
    setMode(newMode);
    setSessionCount(0);
    setPhase('study');
    setShowFocusInput(false);
    setAdaptiveData(null);
    setBreakRec(null);
    if (newMode === 'traditional') { const t = traditionalTimes.study; setTimeLeft(t); setTotalTime(t); }
  };

  const phaseLabel = phase === 'study' ? 'Focus' : phase === 'longBreak' ? 'Long Break' : 'Break';
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">⏱️ Pomodoro Timer</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {mode === 'adaptive' ? 'Smart study sessions with AI break recommendations' : 'Stay focused with timed study sessions'}
        </p>
      </motion.div>

      <div className="max-w-md mx-auto space-y-6">
        <motion.div variants={itemVariants} className="glass-card p-6 text-center">
          <div className="flex justify-center gap-2 mb-6">
            {['traditional', 'adaptive'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'gradient-bg text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {m === 'traditional' ? 'Traditional' : 'Adaptive AI'}
              </button>
            ))}
          </div>

          <div className={`text-xs uppercase tracking-widest mb-4 font-medium ${phase === 'study' ? 'text-primary-500' : 'text-green-500'}`}>
            {phase === 'study' ? '📖 Focus Time' : '☕ Break Time'}
          </div>

          <CircularTimer timeLeft={timeLeft} totalTime={totalTime} />

          <div className="flex items-center justify-center gap-4 mt-6">
            {!isRunning ? (
              <button onClick={startTimer} disabled={timeLeft <= 0}
                className="btn-primary px-8 py-3 text-lg flex items-center gap-2 disabled:opacity-50"
              >
                ▶ {phase === 'study' ? 'Start Focus' : 'Start Break'}
              </button>
            ) : (
              <button onClick={pauseTimer} className="btn-secondary px-8 py-3 text-lg flex items-center gap-2">
                ⏸ Pause
              </button>
            )}
            <button onClick={resetTimer}
              className="btn-secondary px-6 py-3 text-lg flex items-center gap-2"
            >
              ↺ Reset
            </button>
          </div>

          <div className="w-full mt-4">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span className="font-medium">{phaseLabel}</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full gradient-bg rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {mode === 'adaptive' && (
            <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
              <h3 className="text-sm font-semibold mb-2">Focus Level: {focusScore}%</h3>
              <input
                type="range" min="10" max="100" value={focusScore}
                onChange={e => setFocusScore(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>Low</span>
                <span className="font-medium text-primary-500">Study: {getAdaptiveStudyTime()}m • Break: {getBreakTime()}m</span>
                <span>High</span>
              </div>
            </div>
          )}
        </motion.div>

        {mode === 'adaptive' && adaptiveSettings && (
          <motion.div variants={itemVariants}>
            <AdaptiveSettingsPanel settings={adaptiveSettings} />
          </motion.div>
        )}

        {loadingBreak && (
          <motion.div variants={itemVariants} className="glass-card p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">AI is finding the best break for you...</p>
          </motion.div>
        )}

        {breakRec && (
          <motion.div variants={itemVariants} className="glass-card p-4 border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl">
                {breakRec.activity === 'Stretching' ? '🧘' :
                 breakRec.activity === 'Walking' ? '🚶' :
                 breakRec.activity === 'Music' ? '🎵' :
                 breakRec.activity === 'Reading' ? '📖' :
                 breakRec.activity === 'Meditation' ? '🧘' :
                 breakRec.activity === 'Water Break' ? '💧' : '☕'}
              </div>
              <div>
                <h4 className="font-medium text-sm">{breakRec.activity || 'Break'}</h4>
                <p className="text-xs text-[var(--text-secondary)]">{breakRec.duration || getBreakTime()} minutes</p>
              </div>
            </div>
            {breakRec.reason && <p className="text-sm text-[var(--text-secondary)] mb-1">{breakRec.reason}</p>}
            {breakRec.benefits && <p className="text-xs text-green-500">✨ {breakRec.benefits}</p>}
          </motion.div>
        )}

        {mode === 'adaptive' && adaptiveData && (
          <motion.div variants={itemVariants} className="glass-card p-4">
            <h3 className="text-sm font-semibold gradient-text mb-2">Adaptive Insights</h3>
            {adaptiveData.focus_insight && <p className="text-xs text-[var(--text-secondary)] mb-2">{adaptiveData.focus_insight}</p>}
            {adaptiveData.recommended_break && <p className="text-xs text-green-500">Recommended: {adaptiveData.recommended_break}</p>}
          </motion.div>
        )}

        <FocusScoreInput
          show={showFocusInput}
          focusScore={focusScore}
          onFocusScoreChange={setFocusScore}
          onSubmit={handleSubmitFocusScore}
        />

        <motion.div variants={itemVariants}>
          <SessionStats
            sessionCount={sessionCount}
            totalSessions={totalSessions}
            currentMinutes={Math.floor((totalTime - timeLeft) / 60)}
            phaseLabel={phaseLabel}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-primary-500">{sessionCount}</div>
            <div className="text-xs text-[var(--text-secondary)]">Sessions</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-primary-500">{totalStudy}m</div>
            <div className="text-xs text-[var(--text-secondary)]">Study Time</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-primary-500">{focusScore}%</div>
            <div className="text-xs text-[var(--text-secondary)]">Focus</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Pomodoro;
