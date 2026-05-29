import React, { useEffect, useState } from 'react';
import { getSocket } from '../../socket/socket';
import api from '../../services/api';

/**
 * SessionTimer — Premium, real-time synchronized timer panel.
 * Keeps all clients synchronized via WebSocket heartbeat ticks.
 *
 * @param {string} roomId — Room ID context
 * @param {object} currentUser — Currently logged in user context
 * @param {function} onToast — Notification dispatch callback
 */
export default function SessionTimer({ roomId, currentUser, onToast }) {
  const [activeSession, setActiveSession] = useState(null);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);

  // Fetch initial session state on load
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const res = await api.get(`/sessions/room/${roomId}`);
        if (res.data && res.data.id) {
          setActiveSession(res.data);
          // Set initial duration from server
          const elapsed = Math.floor(
            (new Date().getTime() - new Date(res.data.startTime).getTime()) / 1000
          );
          setDuration(elapsed > 0 ? elapsed : 0);
        } else {
          setActiveSession(null);
          setDuration(0);
        }
      } catch (err) {
        console.error('Failed to load active room session:', err);
      }
    };

    fetchActiveSession();
  }, [roomId]);

  // Wire Socket Event Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    setConnected(socket.connected);

    // Join active study session
    socket.emit('join_session', { roomId, userName: currentUser?.fullName });

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    // Listener: Server signals session has started
    const onSessionStarted = (session) => {
      setActiveSession(session);
      setDuration(0);
      onToast?.({ type: 'success', message: `✨ Study session started by ${session.startedByName}!` });
    };

    // Listener: Server signals session has ended
    const onSessionEnded = (data) => {
      setActiveSession(null);
      setDuration(0);
      const minutes = Math.round(data.durationInSeconds / 60);
      onToast?.({ type: 'join', message: `🏆 Session completed! Duration: ${minutes} min.` });
    };

    // Listener: Server timer heartbeat (1-second intervals)
    const onTimerUpdate = (data) => {
      if (data.roomId === roomId) {
        if (!activeSession || activeSession.id !== data.sessionId) {
          // Sync session metadata if out-of-sync
          setActiveSession({
            id: data.sessionId,
            roomId: data.roomId,
            roomName: data.roomName,
            startedByName: data.startedByName,
            status: 'ACTIVE',
          });
        }
        setDuration(data.durationInSeconds);
      }
    };

    const onParticipantJoined = (data) => {
      if (data.email !== currentUser?.email) {
        onToast?.({ type: 'join', message: `👥 ${data.userName} joined the study session.` });
      }
    };

    const onParticipantLeft = (data) => {
      if (data.email !== currentUser?.email) {
        onToast?.({ type: 'leave', message: `👋 ${data.userName} left the study session.` });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('session_started', onSessionStarted);
    socket.on('session_ended', onSessionEnded);
    socket.on('timer_update', onTimerUpdate);
    socket.on('participant_joined_session', onParticipantJoined);
    socket.on('participant_left_session', onParticipantLeft);

    return () => {
      socket.emit('leave_session', { roomId, userName: currentUser?.fullName });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('session_started', onSessionStarted);
      socket.off('session_ended', onSessionEnded);
      socket.off('timer_update', onTimerUpdate);
      socket.off('participant_joined_session', onParticipantJoined);
      socket.off('participant_left_session', onParticipantLeft);
    };
  }, [roomId, currentUser, activeSession]);

  // Actions
  const handleStartSession = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('start_session', { roomId, userName: currentUser?.fullName });
  };

  const handleEndSession = () => {
    if (!confirm('Are you sure you want to end this study session? All progress will be recorded.')) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('end_session', { roomId, userName: currentUser?.fullName });
  };

  // Format HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="glass-card p-5 border-slate-800/80 relative overflow-hidden bg-slate-950/40">
      {/* Decorative backdrop light */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        activeSession ? 'bg-emerald-500/10' : 'bg-slate-800/10'
      }`}></div>

      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${
          activeSession ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
        }`}></span>
        <span>Study Session Tracker</span>
        {activeSession && (
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold px-2 py-0.5 rounded-full ml-auto select-none uppercase tracking-wider animate-pulse">
            ACTIVE
          </span>
        )}
      </h3>

      <div className="text-center my-5">
        <p className={`text-4xl font-mono font-extrabold tracking-tight select-none drop-shadow-md transition-all duration-300 ${
          activeSession 
            ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
            : 'text-slate-500'
        }`}>
          {formatTime(duration)}
        </p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 select-none">
          {activeSession ? `Started by ${activeSession.startedByName || 'Host'}` : 'No active session'}
        </p>
      </div>

      {/* Button Actions */}
      <div className="flex gap-2">
        {!activeSession ? (
          <button
            onClick={handleStartSession}
            className="flex-grow py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            🚀 Start Live Session
          </button>
        ) : (
          <button
            onClick={handleEndSession}
            className="flex-grow py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition cursor-pointer"
          >
            ⏹ Conclude Session
          </button>
        )}
      </div>
    </div>
  );
}
