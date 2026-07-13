import React, { useState, useEffect, useRef } from 'react';
import { breakAPI } from '../services/api';
import { toast } from 'react-toastify';

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

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const ACTIVITY_ICONS = {
  Stretching: '\u{1F9D8}', Walking: '\u{1F6B6}', Music: '\u{1F3B5}',
  Reading: '\u{1F4D6}', Meditation: '\u{1F9D8}', Hydration: '\u{1F4A7}',
  Breathing: '\u{1F9D1}', EyeRest: '\u{1F441}', Snack: '\u{1F35E}',
};

const BreakPage = () => {
  const [focusLevel, setFocusLevel] = useState(5);
  const [studyTime, setStudyTime] = useState(60);
  const [quizScore, setQuizScore] = useState(75);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [effectiveness, setEffectiveness] = useState(null);
  const [breakState, setBreakState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => { fetchHistory(); fetchEffectiveness(); }, []);

  const fetchHistory = async () => {
    try { const res = await breakAPI.getAll(); setHistory(res.data || []); } catch { setHistory([]); }
  };

  const fetchEffectiveness = async () => {
    try { const res = await breakAPI.getEffectiveness(); setEffectiveness(res.data || null); } catch {}
  };

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await breakAPI.recommend({ focus_level: focusLevel, study_time: studyTime, quiz_score: quizScore });
      setRecommendation(res.data);
      toast.success('Break recommendation ready!');
    } catch { toast.error('Failed to get recommendation'); }
    setLoading(false);
  };

  const startBreak = () => {
    if (!recommendation) return;
    const durationSec = (recommendation.duration || 5) * 60;
    setTimeLeft(durationSec);
    setTotalBreakTime(durationSec);
    setBreakState('active');
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setBreakState('completed');
          playNotification();
          toast.success('Break complete! Ready to refocus.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseBreak = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setBreakState('paused');
  };

  const resumeBreak = () => {
    setBreakState('active');
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setBreakState('completed');
          playNotification();
          toast.success('Break complete! Time to get back to studying.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endBreak = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setBreakState('idle');
    setTimeLeft(0);
    setTotalBreakTime(0);
    if (recommendation?.id) {
      try { await breakAPI.markTaken(recommendation.id, { completed: false }); } catch {}
    }
    toast('Break ended early');
    fetchHistory(); fetchEffectiveness();
  };

  const handleBreakComplete = async () => {
    if (recommendation?.id) {
      try { await breakAPI.markTaken(recommendation.id, { completed: true }); } catch {}
    }
    fetchHistory(); fetchEffectiveness();
  };

  const progress = totalBreakTime > 0 ? ((totalBreakTime - timeLeft) / totalBreakTime) * 100 : 0;
  const durationMins = [5, 10, 15, 20, 30];
  const focusLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getActivityIcon = (activity) => ACTIVITY_ICONS[activity] || '\u{1F3AD}';

  return (
    <div className="max-w-3xl mx-auto space-y-5 p-4">
      <div className="glass-card p-6 md:p-8">
        <h1 className="text-2xl font-bold gradient-text mb-1">Take a Break</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Let AI recommend the perfect break for you</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Focus Level (1-10)</label>
            <div className="flex gap-1">
              {focusLabels.map(n => (
                <button key={n} onClick={() => setFocusLevel(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    n <= focusLevel ? 'bg-sky-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Study Time (min)</label>
            <div className="flex gap-1 flex-wrap">
              {durationMins.map(m => (
                <button key={m} onClick={() => setStudyTime(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    studyTime === m ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Quiz Score (%)</label>
            <input type="range" min="0" max="100" value={quizScore} onChange={e => setQuizScore(Number(e.target.value))}
              className="w-full accent-sky-500" />
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
              <span>0%</span>
              <span className="font-bold text-sky-400">{quizScore}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <button onClick={handleRecommend} disabled={loading}
          className="btn-primary flex items-center gap-2 text-sm">
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {loading ? 'Finding...' : '\u{1F50D} Get Break Recommendation'}
        </button>
      </div>

      {recommendation && breakState === 'idle' && (
        <div className="glass-card p-6 border border-sky-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#60C5FF] to-[#38BDF8] flex items-center justify-center text-2xl">
              {getActivityIcon(recommendation.activity)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{recommendation.activity || 'Recommended Break'}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{recommendation.duration || 5} minutes</p>
            </div>
          </div>
          {recommendation.reason && (
            <p className="text-sm text-[var(--text-secondary)] mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">{recommendation.reason}</p>
          )}
          <button onClick={startBreak} className="btn-primary text-sm px-6 py-2">{'\u25B6'} Start Break</button>
        </div>
      )}

      {(breakState === 'active' || breakState === 'paused') && (
        <div className="glass-card p-6 text-center border border-emerald-500/20">
          <div className="text-sm font-medium text-emerald-400 mb-2">
            {breakState === 'active' ? '\u{1F9D8} Break in progress...' : '\u23F8 Break paused'}
          </div>
          <div className="text-5xl font-bold font-mono tracking-wider mb-4">{formatTime(timeLeft)}</div>
          <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-5">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-center gap-3">
            {breakState === 'active' ? (
              <button onClick={pauseBreak} className="px-6 py-2.5 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition-all">
                {'\u23F8'} Pause
              </button>
            ) : (
              <button onClick={resumeBreak} className="px-6 py-2.5 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                {'\u25B6'} Resume
              </button>
            )}
            <button onClick={endBreak} className="px-6 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] glass">
              {'\u2716'} End
            </button>
          </div>
        </div>
      )}

      {breakState === 'completed' && (
        <div className="glass-card p-6 text-center border border-green-500/20">
          <div className="text-4xl mb-2">{'\u2705'}</div>
          <h3 className="font-bold text-lg mb-1">Break Complete!</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">You're refreshed and ready to focus again.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setBreakState('idle'); setRecommendation(null); handleBreakComplete(); }}
              className="btn-primary text-sm px-6 py-2">Done</button>
            <button onClick={() => { setBreakState('idle'); setRecommendation(null); }}
              className="btn-secondary text-sm px-6 py-2">Get Another</button>
          </div>
        </div>
      )}

      {effectiveness?.activities?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-sky-400 rounded-full" />
            Break Effectiveness
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {effectiveness.activities.map((act, i) => (
              <div key={i} className="p-3 rounded-xl text-center bg-[var(--bg-secondary)]">
                <div className="text-2xl mb-1">{getActivityIcon(act.name)}</div>
                <div className="text-xs font-medium">{act.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{act.count} sessions</div>
                <div className="mt-1 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                    style={{ width: `${act.effectiveness || 50}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-sky-400 rounded-full" />
          Break History
        </h3>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">{'\u{1F4AD}'}</div>
            <p className="text-sm text-[var(--text-secondary)]">No break history yet. Take a break to see it here!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
            {history.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getActivityIcon(item.activity)}</span>
                  <div>
                    <div className="text-sm font-medium">{item.activity || 'Break'}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {item.duration || item.duration_minutes || 5} min
                      {item.completed_at && ` \u2022 ${new Date(item.completed_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{item.completed ? 'Completed' : 'Skipped'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakPage;
