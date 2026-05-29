import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDateTime } from '../utils/date';

/**
 * Invitations.jsx — Study Room invitation hub with tabs for Received and Sent invitations.
 * Features: Accept/Reject triggers, pagination, loading states, and responsive dark themes.
 */
export default function Invitations() {
  const navigate = useNavigate();

  // --- States ---
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // tracks which button is loading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Fetch Data ---
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [receivedRes, sentRes] = await Promise.all([
        api.get('/invitations/received'),
        api.get('/invitations/sent'),
      ]);
      setReceived(receivedRes.data || []);
      setSent(sentRes.data || []);
    } catch (err) {
      setError('Failed to fetch invitations. Please check connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // --- Actions ---
  const handleAccept = async (inviteId, roomName, roomId) => {
    setActionLoading(inviteId);
    setError('');
    setSuccess('');
    try {
      await api.post(`/invitations/accept/${inviteId}`);
      setSuccess(`✓ Successfully joined study room: ${roomName}!`);
      // Re-fetch lists
      await fetchInvitations();
      // Brief delay before redirecting to their new workspace
      setTimeout(() => {
        navigate(`/rooms/${roomId}`);
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to accept invitation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inviteId) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    setActionLoading(inviteId);
    setError('');
    setSuccess('');
    try {
      await api.post(`/invitations/reject/${inviteId}`);
      setSuccess('Declined room invitation.');
      await fetchInvitations();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to decline invitation.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Page Title & Tab selectors */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Invitation Center</h2>
          <p className="text-xs text-slate-400 mt-1">Manage study room invitations from your peers.</p>
        </div>

        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 self-start sm:self-auto select-none">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📥 Received ({received.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📤 Sent ({sent.length})
          </button>
        </div>
      </div>

      {/* Alert overlays */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between animate-fade-in">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center justify-between animate-fade-in">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-200 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main content view */}
      {loading ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-24 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse flex items-center justify-between px-6">
              <div className="space-y-2 w-1/3">
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                <div className="h-2.5 bg-slate-800 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-slate-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'received' ? (
        // RECEIVED TAB
        received.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 select-none">
            <span className="text-4xl mb-2">📥</span>
            <h4 className="text-sm font-bold text-white mb-1">No Received Invitations</h4>
            <p className="text-xs text-slate-400">Study room invitations sent to you by other users will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {received.map((invite) => {
              const isPending = invite.status === 'PENDING';
              const isLoading = actionLoading === invite.id;

              return (
                <div 
                  key={invite.id} 
                  className={`glass-card p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/20 ${
                    isPending ? 'border-indigo-500/30' : 'border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        invite.status === 'PENDING'
                          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                          : invite.status === 'ACCEPTED'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-slate-400 bg-slate-800 border-slate-700'
                      }`}>
                        {invite.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDateTime(invite.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-0.5 truncate">{invite.roomName}</h4>
                    <p className="text-xs text-slate-400 leading-normal">
                      Invited by: <span className="text-indigo-300 font-medium">{invite.senderName}</span> ({invite.receiverEmail})
                    </p>
                  </div>

                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(invite.id, invite.roomName, invite.roomId)}
                        disabled={isLoading}
                        className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
                      >
                        {isLoading ? '…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(invite.id)}
                        disabled={isLoading}
                        className="py-1.5 px-3 bg-slate-950 border border-slate-800 hover:bg-rose-950/30 hover:border-rose-500/30 hover:text-rose-400 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                      >
                        {isLoading ? '…' : 'Decline'}
                      </button>
                    </div>
                  ) : invite.status === 'ACCEPTED' ? (
                    <button
                      onClick={() => navigate(`/rooms/${invite.roomId}`)}
                      className="py-1.5 px-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      View Workspace →
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : (
        // SENT TAB
        sent.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 select-none">
            <span className="text-4xl mb-2">📤</span>
            <h4 className="text-sm font-bold text-white mb-1">No Sent Invitations</h4>
            <p className="text-xs text-slate-400">Invitations you send to other peers using room controls will be listed here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sent.map((invite) => (
              <div 
                key={invite.id} 
                className="glass-card p-5 border border-slate-800/80 bg-slate-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 select-none">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      invite.status === 'PENDING'
                        ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse'
                        : invite.status === 'ACCEPTED'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}>
                      {invite.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDateTime(invite.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-0.5 truncate">{invite.roomName}</h4>
                  <p className="text-xs text-slate-400">
                    Invited Peer: <span className="text-indigo-300 font-medium">{invite.receiverEmail}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
