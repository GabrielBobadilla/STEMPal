import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pomodoroAPI, breakAPI } from '../services/api';
import { toast } from 'react-toastify';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  const traditionalTimes = { study: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };

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
      setTotalStudy(s => s + getAdaptiveStudyTime());
      const studyDur = Math.floor((totalTime - timeLeft) / 60) || 1;
      pomodoroAPI.saveSession({ study_duration: studyDur, break_duration: 0, sessions_completed: newCount, mode }).catch(() => {});
      if (mode === 'adaptive') { getBreakRecommendation(); return; }
      if (newCount >= totalSessions) { setPhase('longBreak'); const t = getPhaseTime('longBreak'); setTimeLeft(t); setTotalTime(t); toast.info('Long break!'); }
      else { setPhase('break'); const t = getPhaseTime('break'); setTimeLeft(t); setTotalTime(t); toast.info('Break time!'); }
    } else {
      setPhase('study'); const t = getPhaseTime('study'); setTimeLeft(t); setTotalTime(t);
      toast.success('Break over!');
    }
  };

  const getBreakRecommendation = async () => {
    setLoadingBreak(true);
    try {
      const res = await breakAPI.recommend({ context: 'pomodoro', sessions_completed: sessionCount + 1, focus_score: focusScore, total_study: totalStudy + getAdaptiveStudyTime() });
      setBreakRec(res.data);
      setPhase('break'); const dur = (res.data?.duration || getBreakTime()) * 60; setTimeLeft(dur); setTotalTime(dur);
      toast.info(`${res.data?.activity || 'Break'} recommended`);
    } catch { setPhase('break'); const t = getBreakTime() * 60; setTimeLeft(t); setTotalTime(t); }
    setLoadingBreak(false);
  };

  const getRecoverySuggestions = async () => {
    if (mode !== 'adaptive') return;
    try { const res = await breakAPI.recommend({ context: 'pomodoro', sessions_completed: sessionCount }); setAdaptiveData(res.data); } catch {}
  };

  const handleSubmitFocusScore = async () => {
    try { await pomodoroAPI.saveFocusScore({ score: focusScore, session_type: phase === 'study' ? 'focus' : 'break' }); toast.success('Focus score saved'); setShowFocusInput(false); setFocusScore(75); } catch { toast.error('Failed to save focus score'); }
  };

  const switchMode = (newMode) => {
    pauseTimer(); setMode(newMode); setSessionCount(0); setPhase('study'); setShowFocusInput(false); setAdaptiveData(null); setBreakRec(null);
    if (newMode === 'traditional') { const t = traditionalTimes.study; setTimeLeft(t); setTotalTime(t); }
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const phaseLabel = phase === 'study' ? 'Focus' : phase === 'longBreak' ? 'Long Break' : 'Break';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-2">⏱️</div>
        <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
        <p className="text-sm text-[var(--text-secondary)]">{mode === 'adaptive' ? 'AI-powered sessions' : 'Timed study sessions'}</p>
      </div>

      <div className="flex justify-center gap-2">
        {['traditional', 'adaptive'].map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-sky-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}>{m === 'traditional' ? 'Traditional' : 'Adaptive AI'}</button>
        ))}
      </div>

      <div className="glass-card p-6 text-center">
        <div className={`text-sm font-medium mb-3 ${phase === 'study' ? 'text-sky-400' : 'text-emerald-400'}`}>
          {phase === 'study' ? '📖 Focus Time' : phase === 'longBreak' ? '☕ Long Break' : '🧘 Short Break'}
        </div>

        <div className="flex justify-center gap-1.5 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${
              i < sessionCount % 4 ? 'bg-sky-400' : i === sessionCount % 4 && phase === 'study' ? 'bg-sky-400/50' : 'bg-white/10'
            }`} />
          ))}
        </div>

        <div className="text-6xl font-bold font-mono tracking-wider mb-4">{formatTime(timeLeft)}</div>

        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#60C5FF] to-[#38BDF8]"
            style={{ width: `${progress}%`, transition: 'width 0.3s linear' }} />
        </div>

        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <button onClick={startTimer} disabled={timeLeft <= 0}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#60C5FF] to-[#38BDF8] disabled:opacity-50">
              ▶ {phase === 'study' ? 'Start' : 'Start Break'}
            </button>
          ) : (
            <button onClick={pauseTimer}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600">
              ⏸ Pause
            </button>
          )}
          <button onClick={resetTimer}
            className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] glass">↺ Reset</button>
        </div>
      </div>

      {mode === 'adaptive' && (
        <div className="glass-card p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Focus Level</span>
            <span className="text-sm font-bold text-sky-400">{focusScore}%</span>
          </div>
          <input type="range" min="10" max="100" value={focusScore}
            onChange={e => setFocusScore(Number(e.target.value))} className="w-full accent-sky-500" />
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
            <span>Low</span>
            <span className="text-sky-400">Study: {getAdaptiveStudyTime()}m · Break: {getBreakTime()}m</span>
            <span>High</span>
          </div>
        </div>
      )}

      {loadingBreak && (
        <div className="glass-card p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-[var(--text-secondary)]">Finding best break...</p>
        </div>
      )}

      {breakRec && (
        <div className="glass-card p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">
              {breakRec.activity === 'Stretching' ? '🧘' : breakRec.activity === 'Walking' ? '🚶' : breakRec.activity === 'Music' ? '🎵' : breakRec.activity === 'Reading' ? '📖' : breakRec.activity === 'Meditation' ? '🧘' : '💧'}
            </div>
            <div>
              <h4 className="font-semibold">{breakRec.activity || 'Break'}</h4>
              <p className="text-sm text-[var(--text-secondary)]">{breakRec.duration || getBreakTime()} min</p>
            </div>
          </div>
          {breakRec.reason && <p className="text-sm text-[var(--text-secondary)]">{breakRec.reason}</p>}
        </div>
      )}

      {mode === 'adaptive' && adaptiveData && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-sky-400 mb-2">Insights</h3>
          {adaptiveData.focus_insight && <p className="text-xs text-[var(--text-secondary)]">{adaptiveData.focus_insight}</p>}
        </div>
      )}

      {showFocusInput && (
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3">Rate Your Focus</h3>
          <div className="flex gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setFocusScore(s * 20)}
                className={`w-10 h-10 rounded-xl font-bold ${
                  focusScore / 20 === s ? 'bg-sky-500 text-white' : 'glass'
                }`}>{s}</button>
            ))}
          </div>
          <button onClick={handleSubmitFocusScore} className="btn-primary text-sm px-6 py-2">Submit</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-sky-400">{sessionCount}</div>
          <div className="text-xs text-[var(--text-secondary)]">Sessions</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{totalStudy}m</div>
          <div className="text-xs text-[var(--text-secondary)]">Studied</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{focusScore}%</div>
          <div className="text-xs text-[var(--text-secondary)]">Focus</div>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
