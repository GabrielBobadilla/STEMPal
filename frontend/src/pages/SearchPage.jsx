import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { searchAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const SOURCE_FILTERS = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'human', label: 'My Notes', icon: '📝' },
  { value: 'ai', label: 'AI Notes', icon: '🤖' },
];

const getSourceIcon = (source) => {
  if (source === 'ai') return '🤖';
  if (source === 'pdf') return '📄';
  return '📝';
};

const getSourceColor = (source) => {
  if (source === 'ai') return 'from-blue-500 to-cyan-500';
  if (source === 'pdf') return 'from-blue-500 to-cyan-500';
  return 'from-green-500 to-emerald-500';
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const typeMap = { human: 'human', ai: 'ai', all: undefined };
        const res = await searchAPI.search({
          q: debouncedQuery,
          type: typeMap[sourceFilter]
        });
        setResults(res.data.results || res.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery, sourceFilter]);

  const getSourceBadge = (source) => {
    if (source === 'human') return { label: 'Human Note', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (source === 'ai') return { label: 'AI Generated', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (source === 'pdf') return { label: 'PDF', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: source || 'Note', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  };

  const getResultLink = (result) => {
    if (result.source === 'human' || result.type === 'note') return `/notes/${result._id}`;
    if (result.source === 'ai' || result.type === 'reviewer') return `/reviewer/${result._id}`;
    if (result.source === 'pdf') return `/pdf-reviewer/${result._id}`;
    if (result.type === 'flashcard') return `/flashcards/${result._id}`;
    if (result.type === 'quiz') return `/quiz/${result._id}`;
    return '#';
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">🔍 Smart Search</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Find notes, reviewers, and study materials</p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, notes, reviewers..."
              className="input-field pl-10 w-full text-lg"
              autoFocus
            />
          </div>
          <button onClick={() => setQuery(debouncedQuery)} className="btn-primary px-6">
            Search
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          {SOURCE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                sourceFilter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && (
        <motion.div variants={itemVariants} className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </motion.div>
      )}

      {!loading && searched && results.length === 0 && (
        <motion.div variants={itemVariants} className="glass-card p-8 text-center">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            We couldn't find anything matching "{debouncedQuery}". Try different keywords or adjust your filters.
          </p>
        </motion.div>
      )}

      {!loading && results.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          <motion.p variants={itemVariants} className="text-sm text-[var(--text-secondary)]">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </motion.p>
          {results.map((result, i) => {
            const source = getSourceBadge(result.source || result.type);
            return (
              <motion.div key={result._id || i} variants={itemVariants}>
                <Link to={getResultLink(result)} className="block">
                  <div className="glass-card p-4 hover:shadow-lg transition-all group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSourceColor(result.source)} flex items-center justify-center flex-shrink-0 text-lg`}>
                        {getSourceIcon(result.source)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold group-hover:text-primary-500 transition-colors truncate">
                          {result.title || result.name || 'Untitled'}
                        </h3>
                        {(result.preview || result.content) && (
                          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {result.preview || result.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${source.className}`}>
                            {source.label}
                          </span>
                          {result.subject && (
                            <span className="text-xs text-[var(--text-secondary)]">{result.subject}</span>
                          )}
                          {result.difficulty && (
                            <span className="text-xs text-[var(--text-secondary)]">• {result.difficulty}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[var(--text-secondary)] group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1">→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!loading && !searched && (
        <motion.div variants={itemVariants} className="glass-card p-8 text-center">
          <p className="text-5xl mb-3">📚</p>
          <p className="text-lg font-medium">Search your study materials</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Find notes, AI-generated reviewers, flashcards, quizzes, and more
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchPage;
