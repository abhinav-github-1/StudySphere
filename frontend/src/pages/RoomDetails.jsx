import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoomById, leaveRoom } from '../services/roomService';
import useSocket from '../hooks/useSocket';
import ChatBox from '../components/ChatBox';
import SessionTimer from '../components/session/SessionTimer';

/**
 * RoomDetails.jsx - The main workspace page for a study room.
 * Features:
 *   - Room info header
 *   - Participant list (updated in real time via socket synchronization)
 *   - Session timer (Pomodoro mode)
 *   - Chat Box component with Socket.IO integration
 *   - Premium floating toast notifications
 */
export default function RoomDetails() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── Socket Connection ──────────────────────────────────────────────────────
  const { socket, connected, error: socketError } = useSocket();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  // Session Timer state
  const [timeLeft, setTimeLeft] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Pomodoro');

  // ─── Toasts Engine ─────────────────────────────────────────────────────────
  const addToast = (toast) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Track connection change to trigger toasts
  const prevConnectedRef = useRef(connected);
  useEffect(() => {
    if (prevConnectedRef.current !== connected) {
      if (connected) {
        addToast({ type: 'success', message: '🟢 Reconnected to chat server!' });
      } else {
        addToast({ type: 'error', message: '🔴 Socket disconnected. Reconnecting...' });
      }
      prevConnectedRef.current = connected;
    }
  }, [connected]);

  // ─── Fetch Room ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const res = await getRoomById(roomId);
        setRoom(res.data);
      } catch (err) {
        setError('Room not found or you do not have access.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  // ─── Live Room Updates via WebSocket ──────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    // Listen for room data refresh events (emitted by server on join/leave)
    const handleRoomUpdated = (data) => {
      if (data.roomId === roomId) {
        getRoomById(roomId)
          .then(res => {
            setRoom(res.data);
          })
          .catch(err => {
            console.error('Failed to auto-refresh room detail:', err);
          });
      }
    };

    socket.on('room_updated', handleRoomUpdated);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
    };
  }, [socket, roomId]);

  // ─── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      alert('⏰ Session complete!');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const resetTimer = (mode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimeLeft({ 'Pomodoro': 1500, 'Short Break': 300, 'Long Break': 900 }[mode]);
  };

  // ─── Leave Room REST Action ────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!confirm('Leave this room and return to Dashboard?')) return;
    try {
      await leaveRoom(roomId);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to leave room.');
    }
  };

  // ─── Render States ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-2">
        <span className="animate-spin text-3xl">⏳</span>
        <span className="text-xs font-semibold tracking-wider select-none">LOADING STUDY SESSION…</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'This room does not exist.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const isCreator = room.createdByEmail === user?.email;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Dynamic Overlay Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-auto backdrop-blur-md transition-all duration-300 ${
              toast.type === 'join' || toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : toast.type === 'leave' || toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/95 border-slate-800 text-indigo-300'
            }`}
          >
            <span className="text-base select-none">
              {toast.type === 'join' || toast.type === 'success' ? '✨' : toast.type === 'leave' || toast.type === 'error' ? '👋' : '💬'}
            </span>
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Room Header */}
      <div className="glass-card p-6 mb-6 border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-emerald-400 font-semibold tracking-wider">LIVE SESSION</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              {room.subject || 'General'}
            </span>
            {isCreator && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                👑 Host Room
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">{room.roomName}</h1>
          <p className="text-slate-400 text-sm mt-1">{room.description || 'Welcome to this collaborative study environment.'}</p>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            ← Leave Workspace
          </button>
          {!isCreator && (
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/40 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Leave Room
            </button>
          )}
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Participants + Timer */}
        <div className="flex flex-col gap-6">

          {/* Participants panel */}
          <div className="glass-card p-5 border-slate-800/80">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>👥</span> Participants
              <span className="ml-auto text-xs bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full text-indigo-400 font-bold">
                {room.participantCount || 0} online
              </span>
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {(room.participants || []).map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 animate-fade-in">
                  {/* Initials badge */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0">
                    {p.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                  </div>
                  {p.email === room.createdByEmail && (
                    <span className="text-[9px] text-amber-400 ml-auto" title="Room Creator">👑</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Server Synchronized Session Timer */}
          <SessionTimer 
            roomId={roomId}
            currentUser={user}
            onToast={addToast}
          />

          {/* Session Timer Panel */}
          <div className="glass-card p-5 border-slate-800/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Session Timer
            </h3>

            <div className="text-center my-4">
              <p className="text-4xl font-mono font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(99,102,241,0.4)] select-none">
                {formatTime(timeLeft)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 select-none font-bold uppercase tracking-wider">{timerMode}</p>
            </div>

            {/* Timer mode switch buttons */}
            <div className="flex gap-1 mb-4 text-[10px]">
              {['Pomodoro', 'Short Break', 'Long Break'].map(m => (
                <button
                  key={m}
                  onClick={() => resetTimer(m)}
                  className={`flex-1 py-1.5 rounded-md transition font-semibold cursor-pointer ${
                    timerMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'Pomodoro' ? '🍅' : m === 'Short Break' ? '☕' : '🌙'}
                </button>
              ))}
            </div>

            {/* Timer action triggers */}
            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning(prev => !prev)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  timerRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25'
                }`}
              >
                {timerRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              <button
                onClick={() => resetTimer(timerMode)}
                className="px-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer text-xs"
                title="Reset Timer"
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Realtime ChatBox */}
        <div className="lg:col-span-2 flex flex-col" style={{ minHeight: '500px' }}>
          <ChatBox 
            roomId={roomId}
            currentUser={user}
            onToast={addToast}
            connected={connected}
          />
        </div>
      </div>
    </div>
  );
}
