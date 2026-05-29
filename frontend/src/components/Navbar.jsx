import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../socket/socket';

/**
 * Navbar.jsx — Global navigation panel for StudySphere.
 * Upgraded to integrate unread notification counters, live socket overlays,
 * Bell badges, and quick workspace navigation triggers.
 */
export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path) => location.pathname === path;

  // ─── Fetch Unread Alerts Count ─────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();

    // Listen to local triggers (e.g. when marking alerts as read inside Notifications.jsx)
    window.addEventListener('unread_count_updated', fetchUnreadCount);

    // Bind real-time WebSocket triggers to refresh counts
    const socket = getSocket();
    if (socket) {
      const onNotification = () => fetchUnreadCount();
      socket.on('notification_created', onNotification);

      return () => {
        window.removeEventListener('unread_count_updated', fetchUnreadCount);
        socket.off('notification_created', onNotification);
      };
    }

    return () => {
      window.removeEventListener('unread_count_updated', fetchUnreadCount);
    };
  }, [fetchUnreadCount]);

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/60 bg-dark-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-violet flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <span className="font-sans text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:text-primary-500 transition-colors duration-300">
                Study<span className="text-primary-500">Sphere</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive('/')
                    ? 'text-white bg-dark-800 border border-slate-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-dark-900/50'
                }`}
              >
                Home
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive('/dashboard')
                        ? 'text-white bg-dark-800 border border-slate-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-dark-900/50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-rooms"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive('/my-rooms')
                        ? 'text-white bg-dark-800 border border-slate-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-dark-900/50'
                    }`}
                  >
                    My Rooms
                  </Link>
                  <Link
                    to="/invitations"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive('/invitations')
                        ? 'text-white bg-dark-800 border border-slate-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-dark-900/50'
                    }`}
                  >
                    Invitations
                  </Link>
                  <Link
                    to="/activity"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive('/activity')
                        ? 'text-white bg-dark-800 border border-slate-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-dark-900/50'
                    }`}
                  >
                    Logs
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Controls / Notification Bell Badge */}
          <div className="flex items-center gap-4 select-none">
            {user ? (
              <div className="flex items-center gap-4">
                
                {/* Real-time Notification Bell Icon */}
                <Link 
                  to="/notifications" 
                  className={`relative p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                    isActive('/notifications')
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-dark-800 border-slate-700/50 text-slate-400 hover:text-white hover:bg-dark-900'
                  }`}
                  title="View Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white animate-bounce shadow-md shadow-rose-600/30 border border-dark-950">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <span className="text-xs font-semibold text-slate-300 bg-dark-800 border border-slate-700/50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user.fullName}
                </span>

                <button
                  onClick={logout}
                  className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/25 hover:border-rose-500/40 rounded-xl transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive('/login')
                      ? 'text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-xl group bg-gradient-to-br from-primary-600 to-accent-violet group-hover:from-primary-600 group-hover:to-accent-violet hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-800"
                >
                  <span className="relative px-4 py-2 transition-all duration-200 ease-in bg-dark-950 rounded-lg group-hover:bg-opacity-0">
                    Join Free
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
