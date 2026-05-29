import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/date';

/**
 * ActivityHistory.jsx — SaaS chronological study log timeline with filters,
 * custom icons, category dividers, and pagination.
 */
export default function ActivityHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'ROOM', 'INVITE', 'SESSION'
  const [error, setError] = useState('');

  // --- Fetch Activity History ---
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/activity/my-history?page=${currentPage}&limit=12`);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.totalItems || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getLogIcon = (actionType) => {
    if (actionType?.includes('ROOM')) return '🏫';
    if (actionType?.includes('INVITATION')) return '📥';
    if (actionType?.includes('SESSION')) return '🚀';
    return '💬';
  };

  const getLogColor = (actionType) => {
    if (actionType?.includes('ROOM')) return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10';
    if (actionType?.includes('INVITATION')) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (actionType?.includes('SESSION')) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-slate-400 border-slate-800 bg-slate-900';
  };

  // Simple category filtering
  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    if (filterType === 'ROOM') return log.actionType?.includes('ROOM');
    if (filterType === 'INVITE') return log.actionType?.includes('INVITATION');
    if (filterType === 'SESSION') return log.actionType?.includes('SESSION');
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Header and Filter Category selectors */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5 select-none">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Activity History</h2>
          <p className="text-xs text-slate-400 mt-1">Audit log of your learning actions and interactions.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          {['ALL', 'ROOM', 'INVITE', 'SESSION'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'ROOM' ? 'Rooms' : t === 'INVITE' ? 'Invites' : 'Sessions'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}

      {loading ? (
        // Timeline skeleton load
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse flex items-center gap-4 px-4">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex-shrink-0"></div>
              <div className="space-y-1.5 flex-grow">
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                <div className="h-2 bg-slate-800 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        // Empty State
        <div className="glass-card p-12 text-center text-slate-500 select-none">
          <span className="text-4xl mb-2">⏱</span>
          <h4 className="text-sm font-bold text-white mb-1">No Activity Logged</h4>
          <p className="text-xs text-slate-400">
            {filterType === 'ALL'
              ? 'Timeline is currently empty. Actions you take on rooms, chats, or study timers will register here.'
              : `No activity found matching the ${filterType.toLowerCase()} filter.`}
          </p>
        </div>
      ) : (
        // Vertical Timeline List
        <div className="space-y-4">
          <div className="space-y-4">
            {filteredLogs.map((logItem) => (
              <div 
                key={logItem.id} 
                className="glass-card p-4 border border-slate-800/60 bg-slate-950/20 hover:border-slate-800 transition duration-150 flex gap-4 animate-fade-in"
              >
                {/* Left circular avatar category badge */}
                <div className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs shadow-inner select-none ${getLogColor(logItem.actionType)}`}>
                  {getLogIcon(logItem.actionType)}
                </div>

                {/* Message details */}
                <div className="min-w-0 flex-grow pt-0.5">
                  <p className="font-semibold text-slate-200 leading-relaxed break-words text-xs">{logItem.details}</p>
                  <p className="text-[9px] text-slate-500 mt-1 select-none font-mono font-bold tracking-wider uppercase">
                    {formatDateTime(logItem.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination buttons */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 select-none">
              <span className="text-[10px] text-slate-500">
                Page {currentPage} of {totalPages} ({totalItems} total logs)
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
