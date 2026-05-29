import React from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom, leaveRoom, deleteRoom } from '../services/roomService';
import { useAuth } from '../context/AuthContext';

/**
 * RoomCard - displays a study room summary card.
 * Shows participant count, subject badge, and action buttons (join/leave/delete).
 *
 * Props:
 *   room       - RoomResponse object from backend
 *   onRefresh  - callback to re-fetch rooms after an action
 */
export default function RoomCard({ room, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreator = user?.email === room.createdByEmail;
  const isParticipant = room.participants?.some(p => p.email === user?.email);

  // Subject → gradient color map for visual variety
  const subjectColors = {
    'Computer Science': 'from-indigo-500 to-purple-600',
    'Mathematics':      'from-blue-500 to-cyan-500',
    'Physics':          'from-orange-500 to-red-500',
    'Chemistry':        'from-green-500 to-teal-500',
    'Biology':          'from-pink-500 to-rose-500',
    'Medicine':         'from-red-500 to-pink-600',
    'Engineering':      'from-yellow-500 to-orange-500',
    'Software Engineering': 'from-violet-500 to-purple-600',
    'default':          'from-slate-500 to-slate-700',
  };

  const gradientClass = subjectColors[room.subject] || subjectColors['default'];

  // Subject initials for the avatar
  const initials = room.roomName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const handleJoin = async (e) => {
    e.stopPropagation();
    try {
      await joinRoom(room.id);
      onRefresh?.();
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    try {
      await leaveRoom(room.id);
      onRefresh?.();
    } catch (err) {
      console.error('Leave failed:', err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${room.roomName}"? This cannot be undone.`)) return;
    try {
      await deleteRoom(room.id);
      onRefresh?.();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEnter = () => {
    if (isParticipant) {
      navigate(`/rooms/${room.id}`);
    }
  };

  return (
    <div
      onClick={handleEnter}
      className={`room-card ${isParticipant ? 'cursor-pointer' : ''}`}
    >
      {/* Color Banner with Initials Avatar */}
      <div className={`room-card-banner bg-gradient-to-br ${gradientClass}`}>
        <span className="room-card-initials">{initials}</span>
        {room.isActive && <span className="room-card-live-badge">● LIVE</span>}
      </div>

      {/* Card Body */}
      <div className="room-card-body">
        <div className="room-card-subject-badge">{room.subject || 'General'}</div>
        <h3 className="room-card-title">{room.roomName}</h3>
        <p className="room-card-description">{room.description || 'No description provided.'}</p>

        {/* Meta Row */}
        <div className="room-card-meta">
          <span className="room-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {room.participantCount} {room.participantCount === 1 ? 'member' : 'members'}
          </span>
          <span className="room-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            By {room.createdByFullName || 'Unknown'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="room-card-actions">
          {isParticipant ? (
            <>
              <button className="btn-enter" onClick={handleEnter}>
                Enter Room →
              </button>
              {!isCreator && (
                <button className="btn-leave" onClick={handleLeave}>
                  Leave
                </button>
              )}
            </>
          ) : (
            <button className="btn-join" onClick={handleJoin}>
              + Join Room
            </button>
          )}
          {isCreator && (
            <button className="btn-delete" onClick={handleDelete} title="Delete room">
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
