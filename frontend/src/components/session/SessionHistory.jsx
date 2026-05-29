import React, { useState } from 'react';
import { formatDateTime, formatDuration } from '../../utils/date';

/**
 * SessionHistory — Premium tables to visualize chronological study study session logs.
 * Supports pagination, clean loading states, and custom empty panels.
 *
 * @param {object[]} history — List of completed SessionResponse objects
 * @param {boolean} loading — Loading indicator state
 */
export default function SessionHistory({ history = [], loading = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination calculations
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="glass-card p-5 border-slate-800/80 bg-slate-950/20">
      <div className="flex items-center justify-between mb-4 select-none">
        <h4 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
          <span>📅</span> Study Sessions Log
        </h4>
        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
          {history.length} completed
        </span>
      </div>

      {loading ? (
        // Loading skeleton
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse flex items-center justify-between px-4">
              <div className="w-1/3 h-3 bg-slate-800 rounded-md"></div>
              <div className="w-1/4 h-3 bg-slate-800 rounded-md"></div>
              <div className="w-1/6 h-3 bg-slate-800 rounded-md"></div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-slate-800/60 rounded-xl select-none">
          <span className="text-3xl mb-1.5">🎓</span>
          <p className="text-xs font-bold text-slate-400">No session history yet</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Session completions will compile analytical study hours here.</p>
        </div>
      ) : (
        // Session list table
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900 pb-2 font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-2 px-3">Room Name</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Started By</th>
                  <th className="py-2 px-3 text-right">Participants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-semibold text-white truncate max-w-[150px]">
                      {item.roomName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {formatDateTime(item.startTime)}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-mono font-bold">
                      {formatDuration(item.durationInSeconds)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {item.startedByName}
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-400 font-bold">
                      {item.participants?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination selectors */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-900/60 select-none">
              <span className="text-[10px] text-slate-500">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, history.length)} of {history.length}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer transition disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer transition disabled:cursor-not-allowed"
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
