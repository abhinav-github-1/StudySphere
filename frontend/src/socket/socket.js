import { io } from 'socket.io-client';

/**
 * socket.js — Central Socket.IO client singleton.
 *
 * Architecture:
 *  - One shared socket instance for the entire app.
 *  - Connection is established lazily when connectSocket() is called.
 *  - Disconnected by default to prevent anonymous connections.
 *  - Socket.IO server runs on port 9092 (Spring Boot Netty Socket.IO).
 *
 * Usage:
 *  import { connectSocket, disconnectSocket, getSocket } from './socket';
 *  connectSocket(token);   // call after login
 *  disconnectSocket();     // call on logout / component unmount
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092';

// The single socket instance (null until connectSocket is called)
let socket = null;

/**
 * Creates and connects the socket with the user's JWT token.
 * If already connected, returns the existing socket.
 *
 * @param {string} token — JWT token from localStorage
 * @returns {Socket} the socket.io client instance
 */
export function connectSocket(token) {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    // Pass JWT as query param — validated by SocketIOConfig on server
    query: { token },

    // Transport: websocket first, fallback to polling
    transports: ['websocket', 'polling'],

    // Auto reconnect with exponential backoff
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    // Timeout for initial connection
    timeout: 10000,

    // Don't auto-connect — we call connect() explicitly below
    autoConnect: false,
  });

  socket.connect();
  return socket;
}

/**
 * Returns the current socket instance (may be null if not connected).
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnects and destroys the socket instance.
 * Call this on logout or when leaving the app.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, disconnectSocket, getSocket };
