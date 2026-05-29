import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllRooms, getMyRooms, getCreatedRooms, joinRoom, leaveRoom, deleteRoom } from '../services/roomService';
import CreateRoomModal from '../components/CreateRoomModal';
import SessionHistory from '../components/session/SessionHistory';
import api from '../services/api';
import { formatShortDateTime } from '../utils/date';

/**
 * Dashboard.jsx - Upgraded main workspace and analytics dashboard.
 * Preserves 100% of existing functionality while offering a high-fidelity,
 * college-portfolio-grade analytics dashboard using a tabbed interface.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── Tab State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'analytics'

  // ─── Pomodoro Focus State ───────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(1500); 
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Pomodoro');

  // ─── Rooms State ───────────────────────────────────────────────────────────
  const [allRooms, setAllRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [createdRooms, setCreatedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); 

  // ─── Analytics State ───────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ─── Local Chat State ──────────────────────────────────────────────────────
  const [chats, setChats] = useState([
    { roomId: '_demo', sender: 'System', text: 'Join a room to start chatting in real-time!', time: 'Now' },
  ]);
  const [chatMessage, setChatMessage] = useState('');

  // ─── Fetch Rooms ───────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allRes, myRes, createdRes] = await Promise.all([
        getAllRooms(),
        getMyRooms(),
        getCreatedRooms(),
      ]);
      setAllRooms(allRes.data || []);
      setMyRooms(myRes.data || []);
      setCreatedRooms(createdRes.data || []);

      if (!activeRoomId && myRes.data?.length > 0) {
        setActiveRoomId(myRes.data[0].id);
      }
    } catch (err) {
      setError('Could not load rooms. Please check your connection.');
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRoomId]);

  // ─── Fetch Dashboard Analytics ─────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get('/dashboard/overview');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  // ─── Timer Logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      alert('⏰ Pomodoro complete! Time to take a break.');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetTimer = (mode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    const durations = { 'Pomodoro': 1500, 'Short Break': 300, 'Long Break': 900 };
    setTimeLeft(durations[mode] || 1500);
  };

  // ─── Room Actions ──────────────────────────────────────────────────────────
  const handleJoin = async (roomId, e) => {
    e.stopPropagation();
    setActionLoading(roomId);
    try {
      await joinRoom(roomId);
      await fetchRooms();
      setActiveRoomId(roomId);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to join room.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (roomId, e) => {
    e.stopPropagation();
    setActionLoading(roomId);
    try {
      await leaveRoom(roomId);
      await fetchRooms();
      if (activeRoomId === roomId) setActiveRoomId(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to leave room.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (roomId, roomName, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${roomName}"? This cannot be undone.`)) return;
    setActionLoading(roomId);
    try {
      await deleteRoom(roomId);
      await fetchRooms();
      if (activeRoomId === roomId) setActiveRoomId(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete room.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnterRoom = (roomId) => {
    const isParticipant = myRooms.some(r => r.id === roomId);
    if (isParticipant) navigate(`/rooms/${roomId}`);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg = {
      roomId: activeRoomId || '_demo',
      sender: user?.fullName || 'You',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChats(prev => [...prev, newMsg]);
    setChatMessage('');
  };

  // Derived chat details
  const activeRoom = allRooms.find(r => r.id === activeRoomId) || allRooms[0];
  const activeChats = chats.filter(c => c.roomId === (activeRoomId || '_demo'));

  const isParticipant = (roomId) => myRooms.some(r => r.id === roomId);
  const isCreator = (room) => room.createdByEmail === user?.email;

  // Stat definitions for tab browse panel
  const statCards = [
    { label: 'Active Rooms', value: allRooms.length, icon: '🌐', color: 'from-indigo-500 to-indigo-600' },
    { label: 'My Rooms', value: myRooms.length, icon: '📚', color: 'from-violet-500 to-violet-600' },
    { label: 'Created', value: createdRooms.length, icon: '✏️', color: 'from-emerald-500 to-teal-500' },
    { label: 'Study Streak', value: '🔥 Active', icon: '🔥', color: 'from-amber-500 to-rose-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

      {/* Welcome Banner */}
      <div className="mb-6 p-6 glass-card bg-gradient-to-r from-indigo-600/10 to-transparent border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user?.fullName}</span>! 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">Select a workspace tab to join study sessions or review your learning metrics.</p>
        </div>

        {/* Tab selection widgets */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 self-start md:self-auto select-none">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏫 Discover Rooms
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Activity Dashboard
          </button>
        </div>
      </div>

      {/* Error Alert Overlay */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}

      {/* ────────────────── DISCOVER TAB ────────────────── */}
      {activeTab === 'discover' && (
        <>
          {/* Stats + Timer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {statCards.map((stat, i) => (
                <div key={i} className="glass-card p-6 flex items-center justify-between hover:scale-[1.01] transition-all duration-200 bg-slate-950/20">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                    <h4 className="text-2xl font-extrabold text-white">{stat.value}</h4>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-lg shadow-md`}>
                    {stat.icon}
                  </div>
                </div>
              ))}

              <div className="col-span-2 glass-card p-6 border-slate-800/80 bg-gradient-to-r from-indigo-600/10 via-violet-500/5 to-transparent">
                <h3 className="text-base font-bold text-white mb-1">Weekly Challenge: Active Explorer</h3>
                <p className="text-slate-400 text-[11px] leading-relaxed max-w-lg">
                  Complete 3 study room sessions of 25+ minutes each with at least one peer to unlock the gold avatar ring. 
                  <span className="text-indigo-400 font-semibold font-mono"> {Math.min(myRooms.length, 3)}/3 sessions completed.</span>
                </p>
              </div>
            </div>

            {/* Local Focus Timer */}
            <div className="glass-card p-6 flex flex-col justify-between border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Personal Focus Timer
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">{timerMode}</span>
              </div>

              <div className="text-center my-4">
                <h2 className="text-5xl font-extrabold font-mono tracking-tight text-white mb-4 drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                  {formatTime(timeLeft)}
                </h2>
                <div className="flex justify-center gap-1.5 text-[10px]">
                  {['Pomodoro', 'Short Break', 'Long Break'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => resetTimer(mode)}
                      className={`px-2 py-1 rounded-md transition font-semibold ${timerMode === mode ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer ${
                    timerRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {timerRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button
                  onClick={() => resetTimer(timerMode)}
                  className="px-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer text-xs"
                >
                  ↺
                </button>
              </div>
            </div>
          </div>

          {/* Discover Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1 select-none">
                <div>
                  <h3 className="text-lg font-bold text-white">Discover Study Groups</h3>
                  <p className="text-xs text-slate-400">Search and join live collaborative spaces.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-900/10 cursor-pointer"
                >
                  + New Space
                </button>
              </div>

              {loading ? (
                <div className="glass-card p-10 flex items-center justify-center text-slate-400 text-xs">
                  <span className="animate-spin mr-3 text-base">⏳</span> Loading workspaces…
                </div>
              ) : allRooms.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400 text-xs">
                  <p className="text-3xl mb-3">🏫</p>
                  <p className="font-bold text-white mb-1 text-sm">No active rooms yet</p>
                  <p>Be the first to create one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {allRooms.map((room) => {
                    const joined = isParticipant(room.id);
                    const creator = isCreator(room);
                    const isLoading = actionLoading === room.id;

                    return (
                      <div
                        key={room.id}
                        onClick={() => joined && handleEnterRoom(room.id)}
                        className={`glass-card p-5 border transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/20
                          ${joined ? 'cursor-pointer hover:border-slate-700/80 hover:bg-slate-900/10' : ''} 
                          ${activeRoomId === room.id ? 'border-indigo-500/80 bg-indigo-600/[0.02]' : 'border-slate-800/80'}`}
                      >
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap select-none">
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                              {room.subject || 'General'}
                            </span>
                            {joined && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Joined
                              </span>
                            )}
                            {creator && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Creator
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1 truncate">{room.roomName}</h4>
                          <p className="text-xs text-slate-400 truncate">{room.description || 'Welcome to this learning group.'}</p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/50">
                          <div className="flex items-center gap-1.5 mr-auto sm:mr-0 select-none">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[11px] font-bold text-slate-300 font-mono">
                              {room.participantCount} online
                            </span>
                          </div>

                          {joined ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEnterRoom(room.id); }}
                                className="py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                              >
                                Enter →
                              </button>
                              {!creator && (
                                <button
                                  onClick={(e) => handleLeave(room.id, e)}
                                  disabled={isLoading}
                                  className="py-1.5 px-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  {isLoading ? '…' : 'Leave'}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleJoin(room.id, e)}
                              disabled={isLoading}
                              className="py-1.5 px-4 bg-slate-950 border border-slate-800 text-slate-300 hover:bg-indigo-600/10 hover:border-indigo-500 hover:text-indigo-400 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              {isLoading ? '…' : '+ Join'}
                            </button>
                          )}

                          {creator && (
                            <button
                              onClick={(e) => handleDelete(room.id, room.roomName, e)}
                              disabled={isLoading}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer text-xs"
                              title="Delete Room"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar chat panel */}
            <div className="glass-card flex flex-col h-[500px] border-slate-800/80 bg-slate-950/20">
              <div className="p-4 border-b border-slate-800 bg-slate-950/90 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs truncate max-w-[140px]">
                    {activeRoom?.roomName || 'Select a Room'}
                  </h4>
                  <p className="text-[9px] text-indigo-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Live Demo
                  </p>
                </div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Chat</span>
              </div>

              <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {activeChats.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs mt-10">No messages yet. Say hello! 👋</p>
                ) : (
                  activeChats.map((chat, idx) => (
                    <div key={idx} className={`flex flex-col ${chat.sender === user?.fullName ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-300">{chat.sender}</span>
                        <span className="text-[9px] text-slate-500">{chat.time}</span>
                      </div>
                      <div className={`max-w-[85%] px-3 py-1.5 text-xs rounded-2xl leading-relaxed ${
                        chat.sender === user?.fullName
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                      }`}>
                        {chat.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={activeRoomId ? 'Type a message…' : 'Join a room first…'}
                  disabled={!activeRoomId}
                  className="flex-grow bg-slate-900 text-xs text-white placeholder-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!activeRoomId}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ────────────────── ANALYTICS TAB ────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            // Loading Skeletons
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between p-6">
                  <div className="space-y-2 w-2/3">
                    <div className="h-2.5 bg-slate-800 rounded-md w-3/4"></div>
                    <div className="h-6 bg-slate-800 rounded-md w-1/2"></div>
                  </div>
                  <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Analytics Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                <div className="glass-card p-5 flex items-center justify-between bg-slate-950/20 hover:scale-[1.01] transition duration-200">
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Total Study Time</p>
                    <h4 className="text-2xl font-extrabold text-white font-mono">{analytics.totalStudyHours} hrs</h4>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">Concluded sessions sum</p>
                  </div>
                  <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl shadow-inner">
                    ⏱
                  </div>
                </div>

                <div className="glass-card p-5 flex items-center justify-between bg-slate-950/20 hover:scale-[1.01] transition duration-200">
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Total Sessions</p>
                    <h4 className="text-2xl font-extrabold text-white font-mono">{analytics.totalSessions}</h4>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">Participated study sessions</p>
                  </div>
                  <div className="w-11 h-11 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold text-xl shadow-inner">
                    🎓
                  </div>
                </div>

                <div className="glass-card p-5 flex items-center justify-between bg-slate-950/20 hover:scale-[1.01] transition duration-200">
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Average Duration</p>
                    <h4 className="text-2xl font-extrabold text-white font-mono">{analytics.averageSessionLength} min</h4>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">Mean duration per session</p>
                  </div>
                  <div className="w-11 h-11 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 font-bold text-xl shadow-inner">
                    📈
                  </div>
                </div>

                <div className="glass-card p-5 flex items-center justify-between bg-slate-950/20 hover:scale-[1.01] transition duration-200">
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Longest Session</p>
                    <h4 className="text-2xl font-extrabold text-white font-mono">{analytics.longestSession} min</h4>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1">Personal record single session</p>
                  </div>
                  <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
                    🏆
                  </div>
                </div>
              </div>

              {/* Productivity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Weekly Summary chart + streaks */}
                <div className="flex flex-col gap-6">
                  {/* Streak Card */}
                  <div className="glass-card p-5 bg-gradient-to-br from-slate-950 to-dark-900 border-slate-800/80 relative overflow-hidden select-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl animate-pulse"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <span>🔥</span> Study Streak & Favorites
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-rose-500/20">
                        <span className="text-[10px] font-bold text-white uppercase font-mono leading-none mb-0.5">DAYS</span>
                        <span className="text-2xl font-extrabold text-white font-mono leading-none">{analytics.studyStreak || 0}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {analytics.studyStreak > 0 ? `${analytics.studyStreak}-Day Active Streak!` : 'Start a study streak!'}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                          {analytics.studyStreak > 0 
                            ? 'Complete at least 1 study session daily to sustain your streak flame.'
                            : 'Join any room session today to ignite your study streak!'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-900 pt-3 flex justify-between text-xs select-none">
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Most Active Room</p>
                        <p className="text-white font-bold truncate max-w-[130px] mt-0.5">{analytics.mostActiveRoom}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Monthly Total</p>
                        <p className="text-indigo-400 font-bold font-mono mt-0.5">{analytics.monthlyStudyHours} hrs</p>
                      </div>
                    </div>
                  </div>

                  {/* Weekly study hours chart (GORGEOUS PURE CSS BAR CHART) */}
                  <div className="glass-card p-5 bg-slate-950/20 border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                      <span>📊</span> Weekly Productivity Summary
                    </h3>
                    
                    {/* Visual Bar Graph */}
                    <div className="flex items-end justify-between h-36 px-2 select-none">
                      {Object.entries(analytics.weeklyBreakdown || {}).map(([day, val]) => {
                        // Find max daily hours to scale graph (default to 4 hours scale)
                        const maxVal = Math.max(...Object.values(analytics.weeklyBreakdown || {}), 4);
                        const percentHeight = Math.min((val / maxVal) * 100, 100);

                        return (
                          <div key={day} className="flex flex-col items-center flex-1 group">
                            {/* Hour indicator on hover */}
                            <span className="text-[9px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 -translate-y-1 select-none font-mono">
                              {val}h
                            </span>
                            {/* Bar segment */}
                            <div 
                              style={{ height: `${percentHeight}%` }} 
                              className={`w-4 rounded-t-md transition-all duration-300 shadow-md ${
                                val > 0 
                                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-indigo-500/10 hover:shadow-indigo-500/20' 
                                  : 'bg-slate-900/60'
                              }`}
                            ></div>
                            <span className="text-[10px] text-slate-400 font-semibold mt-2">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right side: Activity Timeline + Heatmap */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Timeline section */}
                  <div className="glass-card p-5 bg-slate-950/20 border-slate-800/80 flex-grow">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <span>⏱</span> Activity Timeline
                    </h3>
                    
                    {analytics.activityTimeline?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
                        <span className="text-2xl mb-1 select-none">💬</span>
                        <p className="text-xs font-bold">Timeline is currently empty</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Room actions and messaging will compile audit logs here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {analytics.activityTimeline.map((logItem, idx) => {
                          const isRoom = logItem.actionType?.includes('ROOM');
                          const isSession = logItem.actionType?.includes('SESSION');
                          const icon = isRoom ? '🏫' : isSession ? '🚀' : '💬';
                          const color = isRoom ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' : isSession ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400 border-slate-800 bg-slate-900';

                          return (
                            <div key={logItem.id || idx} className="flex gap-3 text-xs items-start">
                              {/* Left icon circle */}
                              <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 text-xs shadow-inner select-none ${color}`}>
                                {icon}
                              </div>
                              {/* Log message */}
                              <div className="min-w-0 flex-grow pt-0.5">
                                <p className="font-semibold text-slate-200 leading-relaxed break-words">{logItem.details}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5 select-none font-mono">
                                  {formatShortDateTime(logItem.timestamp)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Detailed history table */}
                <div className="lg:col-span-3">
                  <SessionHistory 
                    history={analytics.recentSessions.map(s => ({
                      id: s.id,
                      roomName: s.roomName,
                      startedByName: s.startedByName,
                      durationInSeconds: s.durationInSeconds,
                      startTime: s.startTime,
                      participants: Array(s.participantCount).fill({}) // DTO mapped compatibility
                    }))} 
                    loading={false} 
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center text-slate-500">
              <span className="text-4xl mb-2 select-none">⚠️</span>
              <p className="text-sm font-bold text-white">Failed to Compile Dashboard Analytics</p>
              <p className="text-xs text-slate-400 mt-1">Please ensure the backend server remains reachable.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchRooms}
      />
    </div>
  );
}
