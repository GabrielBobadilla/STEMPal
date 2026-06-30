import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { breakAPI } from '../services/api';
import { toast } from 'react-toastify';
import BreakForm from '../components/breaks/BreakForm';
import RecommendationCard from '../components/breaks/RecommendationCard';
import EffectivenessChart from '../components/breaks/EffectivenessChart';
import BreakHistory from '../components/breaks/BreakHistory';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } }
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchEffectiveness();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await breakAPI.getAll();
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    }
  };

  const fetchEffectiveness = async () => {
    try {
      const res = await breakAPI.getEffectiveness();
      setEffectiveness(res.data || null);
    } catch {}
  };

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await breakAPI.recommend({
        focus_level: focusLevel,
        study_time: studyTime,
        quiz_score: quizScore
      });
      setRecommendation(res.data);
      toast.success('Break recommendation ready!');
    } catch {
      toast.error('Failed to get recommendation');
    } finally {
      setLoading(false);
    }
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setBreakState('paused');
    toast.info('Break paused');
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setBreakState('idle');
    setTimeLeft(0);
    setTotalBreakTime(0);
    if (recommendation?.id) {
      try {
        await breakAPI.markTaken(recommendation.id, { completed: false });
      } catch {}
    }
    toast('Break ended early');
    fetchHistory();
    fetchEffectiveness();
  };

  const handleBreakComplete = async () => {
    if (recommendation?.id) {
      try {
        await breakAPI.markTaken(recommendation.id, { completed: true });
      } catch {}
    }
    fetchHistory();
    fetchEffectiveness();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Take a Break</h1>
        <p className="text-[var(--text-secondary)] mb-6">Let AI recommend the perfect break for you</p>

        <BreakForm
          focusLevel={focusLevel}
          studyTime={studyTime}
          quizScore={quizScore}
          loading={loading}
          onFocusLevelChange={setFocusLevel}
          onStudyTimeChange={setStudyTime}
          onQuizScoreChange={setQuizScore}
          onRecommend={handleRecommend}
        />
      </motion.div>

      {recommendation && (
          <RecommendationCard
            recommendation={recommendation}
            breakState={breakState}
            timeLeft={timeLeft}
            totalBreakTime={totalBreakTime}
            onStartBreak={startBreak}
            onPauseBreak={pauseBreak}
            onResumeBreak={resumeBreak}
            onEndBreak={endBreak}
            onDone={() => {
              setBreakState('idle');
              setRecommendation(null);
              handleBreakComplete();
            }}
          />
        )}

      {effectiveness && effectiveness.activities && effectiveness.activities.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h2 className="text-lg font-semibold gradient-text mb-4">Break Effectiveness</h2>
          <EffectivenessChart effectiveness={effectiveness} />
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold gradient-text mb-4">Break History</h2>
        <BreakHistory history={history} />
      </motion.div>
    </motion.div>
  );
};

export default BreakPage;
