import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRooms, getCreatedRooms, leaveRoom, deleteRoom } from '../services/roomService';

/**
 * MyRooms.jsx - Shows all rooms the user is part of:
 *   - Rooms they joined
 *   - Rooms they created
 */
export default function MyRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joinedRooms, setJoinedRooms] = useState([]);
  const [createdRooms, setCreatedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' | 'created'
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [joinedRes, createdRes] = await Promise.all([
        getMyRooms(),
        getCreatedRooms(),
      ]);
      setJoinedRooms(joinedRes.data || []);
      setCreatedRooms(createdRes.data || []);
    } catch (err) {
      setError('Failed to load your rooms. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLeave = async (roomId) => {
    if (!confirm('Leave this room?')) return;
    setActionLoading(roomId);
    try {
      await leaveRoom(roomId);
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to leave room.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (roomId, roomName) => {
    if (!confirm(`Delete "${roomName}"? This is permanent.`)) return;
    setActionLoading(roomId);
    try {
      await deleteRoom(roomId);
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete room.');
    } finally {
      setActionLoading(null);
    }
  };

  const displayRooms = activeTab === 'joined' ? joinedRooms : createdRooms;

  // Subject color map for badges
  const subjectColors = {
    'Computer Science': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    'Mathematics': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Physics': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Chemistry': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Biology': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    'default': 'text-primary-400 bg-primary-500/10 border-primary-500/20',
  };

  const getBadgeClass = (subject) => subjectColors[subject] || subjectColors['default'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">My Study Rooms</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage the rooms you've joined and created, {user?.fullName?.split(' ')[0]}.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-dark-950/60 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('joined')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'joined'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📚 Joined Rooms <span className="ml-1.5 text-xs opacity-70">({joinedRooms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('created')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'created'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ✏️ Created Rooms <span className="ml-1.5 text-xs opacity-70">({createdRooms.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center text-slate-400">
          <span className="animate-spin mr-3 text-xl">⏳</span> Loading your rooms…
        </div>
      ) : displayRooms.length === 0 ? (
        <div className="glass-card p-16 text-center text-slate-400">
          <p className="text-4xl mb-4">{activeTab === 'joined' ? '📭' : '🏗️'}</p>
          <p className="text-white font-semibold text-lg mb-2">
            {activeTab === 'joined' ? 'No rooms joined yet' : 'No rooms created yet'}
          </p>
          <p className="text-sm">
            {activeTab === 'joined'
              ? 'Head to the Dashboard to browse and join a study room!'
              : 'Create your first room from the Dashboard!'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition"
          >
            Go to Dashboard →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayRooms.map(room => {
            const isLoading = actionLoading === room.id;
            const isOwner = room.createdByEmail === user?.email;

            return (
              <div
                key={room.id}
                className="glass-card p-6 border border-slate-800/80 hover:border-slate-700/60 transition-all cursor-pointer group"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                {/* Room Name & Subject */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors truncate flex-1 mr-3">
                    {room.roomName}
                  </h3>
                  {isOwner && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex-shrink-0">
                      👑 Owner
                    </span>
                  )}
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full border ${getBadgeClass(room.subject)}`}>
                  {room.subject || 'General'}
                </span>

                <p className="text-slate-400 text-xs mt-3 mb-4 line-clamp-2">
                  {room.description || 'No description available.'}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {room.participantCount} {room.participantCount === 1 ? 'member' : 'members'}
                  </span>
                  <span>By {room.createdByFullName}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 border-t border-slate-800 pt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${room.id}`); }}
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Enter Room →
                  </button>

                  {!isOwner ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLeave(room.id); }}
                      disabled={isLoading}
                      className="px-4 py-2 bg-dark-950 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-lg transition"
                    >
                      {isLoading ? '…' : 'Leave'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(room.id, room.roomName); }}
                      disabled={isLoading}
                      className="px-4 py-2 bg-dark-950 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-lg transition"
                    >
                      {isLoading ? '…' : '🗑 Delete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
