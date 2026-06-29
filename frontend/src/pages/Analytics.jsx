import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import MetricCard from '../components/analytics/MetricCard';
import PeriodToggle from '../components/analytics/PeriodToggle';
import ChartCard from '../components/analytics/ChartCard';
import { lineOptions, barOptions, buildLineData, chartDefaults } from '../components/analytics/chartHelpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Analytics = () => {
  const [period, setPeriod] = useState('weekly');
  const [isDark, setIsDark] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [studyTimeTrend, setStudyTimeTrend] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [focusTrend, setFocusTrend] = useState(null);
  const [streakGrowth, setStreakGrowth] = useState(null);
  const [breakEffectiveness, setBreakEffectiveness] = useState(null);
  const [learningProgress, setLearningProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        metricsRes,
        studyRes,
        quizRes,
        focusRes,
        streakRes,
        breakRes,
        learningRes
      ] = await Promise.all([
        analyticsAPI.getMetrics().catch(() => ({ data: null })),
        analyticsAPI.getStudyTimeTrend({ period }).catch(() => ({ data: null })),
        analyticsAPI.getQuizPerformance().catch(() => ({ data: null })),
        analyticsAPI.getFocusTrend().catch(() => ({ data: null })),
        analyticsAPI.getStreakGrowth().catch(() => ({ data: null })),
        analyticsAPI.getBreakEffectiveness().catch(() => ({ data: null })),
        analyticsAPI.getLearningProgress().catch(() => ({ data: null }))
      ]);

      setMetrics(metricsRes.data);
      setStudyTimeTrend(studyRes.data);
      setQuizPerformance(quizRes.data);
      setFocusTrend(focusRes.data);
      setStreakGrowth(streakRes.data);
      setBreakEffectiveness(breakRes.data);
      setLearningProgress(learningRes.data);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    toast.info(`Exporting as ${format}... This feature will be available soon.`);
  };

  const metricCards = metrics ? [
    { label: 'Total Study Time', value: `${metrics.total_study_time || 0}h`, icon: '⏰', sub: `${metrics.this_period_study_time || 0}h this ${period}` },
    { label: 'Avg Quiz Score', value: `${metrics.avg_quiz_score || 0}%`, icon: '📝', sub: `${metrics.quizzes_taken || 0} quizzes taken` },
    { label: 'Focus Improvement', value: `${metrics.focus_improvement || 0}%`, icon: '🎯', sub: `${metrics.sessions_focused || 0} focused sessions` },
    { label: 'Engagement', value: `${metrics.engagement_rate || 0}%`, icon: '💪', sub: `${metrics.active_days || 0} active days` }
  ] : [
    { label: 'Total Study Time', value: '0h', icon: '⏰', sub: 'Loading...' },
    { label: 'Avg Quiz Score', value: '0%', icon: '📝', sub: 'Loading...' },
    { label: 'Focus Improvement', value: '0%', icon: '🎯', sub: 'Loading...' },
    { label: 'Engagement', value: '0%', icon: '💪', sub: 'Loading...' }
  ];

  const studyChartData = buildLineData(studyTimeTrend, 'Study Time (min)', '#3b82f6', true);
  const quizChartData = quizPerformance ? {
    labels: quizPerformance.labels,
    datasets: [
      {
        label: 'Quiz Score',
        data: quizPerformance.scores,
        borderColor: '#10b981',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Questions',
        data: quizPerformance.question_counts,
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        type: 'bar',
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  } : null;

  const quizOptions = isDark ? {
    ...lineOptions(isDark, ''),
    scales: {
      x: { grid: chartDefaults(isDark).gridColor ? { color: chartDefaults(isDark).gridColor } : { display: false }, ticks: { color: chartDefaults(isDark).textColor } },
      y: { grid: { color: chartDefaults(isDark).gridColor }, ticks: { color: chartDefaults(isDark).textColor }, beginAtZero: true, position: 'left' },
      y1: { grid: { display: false }, ticks: { color: chartDefaults(isDark).textColor }, beginAtZero: true, position: 'right' }
    }
  } : {
    ...lineOptions(false, ''),
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6b7280' } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6b7280' }, beginAtZero: true, position: 'left' },
      y1: { grid: { display: false }, ticks: { color: '#6b7280' }, beginAtZero: true, position: 'right' }
    }
  };

  const focusChartData = buildLineData(focusTrend, 'Focus Score', '#ec4899', true);
  const streakChartData = streakGrowth ? {
    labels: streakGrowth.labels,
    datasets: [{
      label: 'Streak Growth',
      data: streakGrowth.values,
      backgroundColor: isDark
        ? ['rgba(251, 146, 60, 0.7)', 'rgba(251, 146, 60, 0.5)', 'rgba(251, 146, 60, 0.3)']
        : ['rgba(251, 146, 60, 0.7)', 'rgba(251, 146, 60, 0.5)', 'rgba(251, 146, 60, 0.3)'],
      borderColor: '#fb923c',
      borderWidth: 1,
      borderRadius: 4
    }]
  } : null;

  const breakChartData = breakEffectiveness ? {
    labels: breakEffectiveness.labels || breakEffectiveness.activities,
    datasets: [{
      label: 'Effectiveness',
      data: breakEffectiveness.values || breakEffectiveness.scores,
      backgroundColor: isDark
        ? ['rgba(16, 185, 129, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(168, 85, 247, 0.7)']
        : ['rgba(16, 185, 129, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(168, 85, 247, 0.7)'],
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      borderRadius: 4
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-1">Analytics</h1>
            <p className="text-[var(--text-secondary)] text-sm">Track your study performance and progress</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PeriodToggle period={period} onChange={setPeriod} />
            <div className="flex gap-2 flex-wrap">
              {['Excel', 'PDF', 'CSV'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors"
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m, i) => (
          <MetricCard key={i} icon={m.icon} value={m.value} label={m.label} sub={m.sub} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {studyChartData && (
          <ChartCard title="Study Time Trend">
            <Line data={studyChartData} options={lineOptions(isDark, '')} />
          </ChartCard>
        )}

        {quizChartData && (
          <ChartCard title="Quiz Performance">
            <Line data={quizChartData} options={quizOptions} />
          </ChartCard>
        )}

        {focusChartData && (
          <ChartCard title="Focus Trend">
            <Line data={focusChartData} options={lineOptions(isDark, '')} />
          </ChartCard>
        )}

        {streakChartData && (
          <ChartCard title="Streak Growth">
            <Bar data={streakChartData} options={barOptions(isDark, '')} />
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {breakChartData && (
          <ChartCard title="Break Effectiveness">
            <Bar data={breakChartData} options={barOptions(isDark, 'Break Effectiveness')} />
          </ChartCard>
        )}

        {learningProgress && (
          <ChartCard title="Learning Progress">
            <div className="space-y-4">
              {(learningProgress.topics || learningProgress.subjects || []).map((topic, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-primary)]">{topic.name || topic.subject}</span>
                    <span className="text-[var(--text-secondary)]">{topic.progress || topic.score || 0}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress || topic.score || 0}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full gradient-bg"
                    />
                  </div>
                </div>
              ))}
              {(!learningProgress.topics && !learningProgress.subjects) && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No learning progress data yet</p>
              )}
            </div>
          </ChartCard>
        )}
      </div>
    </motion.div>
  );
};

export default Analytics;
