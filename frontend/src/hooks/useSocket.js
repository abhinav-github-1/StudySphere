import { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';

/**
 * useSocket — manages the Socket.IO connection lifecycle.
 *
 * - Connects on mount using the JWT from localStorage.
 * - Disconnects on unmount (cleanup).
 * - Tracks connection status and reconnection events.
 * - Prevents duplicate connections via a ref guard.
 *
 * @returns {{ socket: Socket|null, connected: boolean, error: string|null }}
 */
export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found. Please log in.');
      return;
    }

    // Connect (reuses existing socket if already connected)
    const sock = connectSocket(token);
    socketRef.current = sock;

    // ── Connection Events ──────────────────────────────────────────────────

    const onConnect = () => {
      if (mountedRef.current) {
        setConnected(true);
        setError(null);
      }
    };

    const onDisconnect = (reason) => {
      if (mountedRef.current) {
        setConnected(false);
        // If disconnected intentionally (by server/client), don't show error
        if (reason !== 'io client disconnect') {
          setError(`Disconnected: ${reason}. Reconnecting...`);
        }
      }
    };

    const onConnectError = (err) => {
      if (mountedRef.current) {
        setConnected(false);
        setError(`Connection error: ${err.message}`);
      }
    };

    const onReconnect = (attempt) => {
      if (mountedRef.current) {
        setConnected(true);
        setError(null);
      }
    };

    const onReconnectFailed = () => {
      if (mountedRef.current) {
        setError('Could not reconnect to server. Please refresh the page.');
      }
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('connect_error', onConnectError);
    sock.on('reconnect', onReconnect);
    sock.on('reconnect_failed', onReconnectFailed);

    // If already connected when hook mounts, update state immediately
    if (sock.connected) {
      setConnected(true);
    }

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      mountedRef.current = false;
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('connect_error', onConnectError);
      sock.off('reconnect', onReconnect);
      sock.off('reconnect_failed', onReconnectFailed);
      // Note: we do NOT disconnect here — the socket is shared across pages.
      // Call disconnectSocket() explicitly on logout.
    };
  }, []); // run once on mount

  return {
    socket: socketRef.current,
    connected,
    error,
  };
}
