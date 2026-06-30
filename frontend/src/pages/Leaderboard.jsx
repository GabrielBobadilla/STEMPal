import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamificationAPI } from '../services/api';
import { toast } from 'react-toastify';

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' }
];

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const [lbRes, rankRes] = await Promise.all([
        gamificationAPI.getLeaderboard({ period }),
        gamificationAPI.getRanking()
      ]);
      setLeaderboard(lbRes.data?.leaderboard || lbRes.data || []);
      setRanking(rankRes.data);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Leaderboard</h1>
        <p className="text-[var(--text-secondary)]">Top students this period</p>
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
              period === p.key
                ? 'gradient-bg text-white shadow-lg'
                : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-5xl block mb-4">🏆</span>
          <h3 className="text-lg font-semibold mb-1">No rankings yet</h3>
          <p className="text-sm text-[var(--text-secondary)]">Start studying to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 20).map((entry, index) => {
            const isCurrentUser = user && (entry._id === user._id || entry.userId === user._id || entry.user?._id === user._id);
            return (
              <div
                key={entry._id || entry.userId || index}
                className={`glass-card p-4 flex items-center gap-4 transition-all duration-300 ${
                  isCurrentUser ? 'ring-2 ring-sky-500 bg-sky-500/5' : ''
                }`}
              >
                <div className="w-10 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{MEDALS[index]}</span>
                  ) : (
                    <span className="text-sm font-bold text-[var(--text-secondary)]">#{index + 1}</span>
                  )}
                </div>

<div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(entry.fullname || entry.name || entry.username || '?').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.fullname || entry.name || entry.username || 'Unknown'}
                    {isCurrentUser && <span className="text-sky-400 text-xs ml-2">(You)</span>}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Level {entry.level || entry.levelInfo?.level || 1}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold gradient-text">{entry.xp || entry.totalXp || 0}</p>
                  <p className="text-xs text-[var(--text-secondary)]">XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ranking && ranking.rank && ranking.rank > 20 && (
        <div className="glass-card p-4 flex items-center gap-4 ring-2 ring-sky-500 bg-sky-500/5">
          <div className="w-10 text-center">
            <span className="text-sm font-bold text-[var(--text-secondary)]">#{ranking.rank}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(user?.fullname || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {user?.fullname || 'You'}
              <span className="text-sky-400 text-xs ml-2">(You)</span>
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Level {ranking.level || ranking.levelInfo?.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="font-bold gradient-text">{ranking.xp || ranking.totalXp || 0}</p>
            <p className="text-xs text-[var(--text-secondary)]">XP</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
