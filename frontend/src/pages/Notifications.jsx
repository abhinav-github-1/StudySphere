import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../socket/socket';
import { formatShortDateTime } from '../utils/date';

/**
 * Notifications.jsx — Study notifications panel displaying persistent alerts.
 * Features: Mark as read, mark all read, live socket stream syncing, unread filters.
 */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Fetch Notifications ---
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- Live Socket Notifications Push ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for new in-app notification creations
    const onNotificationCreated = (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    };

    socket.on('notification_created', onNotificationCreated);

    return () => {
      socket.off('notification_created', onNotificationCreated);
    };
  }, []);

  // --- Actions ---
  const handleMarkRead = async (notifId) => {
    try {
      await api.post(`/notifications/read/${notifId}`);
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      // Dispatch global unread count update trigger
      window.dispatchEvent(new Event('unread_count_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('unread_count_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    if (type?.includes('RECEIVED')) return '📥';
    if (type?.includes('ACCEPTED')) return '✨';
    if (type?.includes('REJECTED')) return '👋';
    if (type?.includes('SESSION')) return '🚀';
    return '🔔';
  };

  const getAlertColor = (type) => {
    if (type?.includes('RECEIVED')) return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10';
    if (type?.includes('ACCEPTED')) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (type?.includes('REJECTED')) return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (type?.includes('SESSION')) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-slate-400 border-slate-800 bg-slate-900';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Header Controls */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-900 pb-5 select-none">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Notifications</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time alerts and study room updates.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="py-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ✓ Mark All Read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}

      {loading ? (
        // Skeletons
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse flex items-center gap-4 px-4">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex-shrink-0"></div>
              <div className="space-y-1.5 flex-grow">
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                <div className="h-2.5 bg-slate-800 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        // Empty State
        <div className="glass-card p-12 text-center text-slate-500 select-none">
          <span className="text-4xl mb-2">🔔</span>
          <h4 className="text-sm font-bold text-white mb-1">Clean Slate!</h4>
          <p className="text-xs text-slate-400">All caught up. When invitations or room activity updates occur, they will log here.</p>
        </div>
      ) : (
        // Alerts Timeline list
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`glass-card p-4 border flex gap-4 bg-slate-950/20 transition-all duration-200 ${
                notif.isRead 
                  ? 'border-slate-800/80 opacity-60' 
                  : 'border-indigo-500/30 bg-indigo-600/[0.01] shadow-md shadow-indigo-600/5'
              }`}
            >
              {/* Left category icon bubble */}
              <div className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs shadow-inner select-none ${getAlertColor(notif.type)}`}>
                {getAlertIcon(notif.type)}
              </div>

              {/* Message text */}
              <div className="min-w-0 flex-grow pt-0.5">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-xs font-bold text-white leading-normal truncate">{notif.title}</h4>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wider select-none uppercase shrink-0 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{notif.message}</p>
                <p className="text-[9px] text-slate-500 mt-1 select-none font-mono">{formatShortDateTime(notif.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
