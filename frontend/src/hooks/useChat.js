import { useEffect, useState, useRef, useCallback } from 'react';
import { getSocket } from '../socket/socket';
import api from '../services/api';

/**
 * useChat — all chat logic for a study room.
 *
 * Responsibilities:
 *  1. Fetch chat history from REST API on mount
 *  2. Emit join_room / leave_room via socket
 *  3. Listen for receive_message, user_joined, user_left, typing_indicator
 *  4. Provide sendMessage, startTyping, stopTyping functions
 *  5. Clean up ALL listeners on unmount (prevent duplicate events)
 *
 * @param {string} roomId    - The study room ID
 * @param {object} user      - Authenticated user { fullName, email }
 * @param {function} onToast - Callback for toast notifications
 *
 * @returns {object} { messages, typingUsers, participants, sendMessage, startTyping, stopTyping, loading }
 */
export default function useChat(roomId, user, onToast) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // users currently typing
  const [loading, setLoading] = useState(true);
  const typingTimerRef = useRef(null); // debounce timer for typing_stop
  const isTypingRef = useRef(false);   // prevent duplicate typing_start events
  const mountedRef = useRef(true);

  // ─── Fetch History on mount ────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const fetchHistory = async () => {
      if (!roomId) return;
      setLoading(true);
      try {
        const res = await api.get(`/chat/history/${roomId}`);
        if (mountedRef.current) {
          setMessages(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchHistory();
    return () => { mountedRef.current = false; };
  }, [roomId]);

  // ─── Socket Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId || !user) return;

    // Emit join_room (server adds client to the Netty room channel)
    socket.emit('join_room', {
      roomId,
      userName: user.fullName,
    });

    // ── Incoming: receive_message ──────────────────────────────────────────
    const onReceiveMessage = (msg) => {
      if (!mountedRef.current) return;
      setMessages(prev => {
        // Prevent duplicate messages (same ID)
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        
        // Show toast notification for other users' messages
        if (msg.senderEmail !== user.email) {
          onToast?.({ 
            type: 'message', 
            message: `${msg.senderName}: ${msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message}` 
          });
        }
        
        return [...prev, msg];
      });
    };

    // ── Incoming: user_joined ──────────────────────────────────────────────
    const onUserJoined = (data) => {
      if (!mountedRef.current) return;
      // Don't show notification for self
      if (data.email !== user.email) {
        onToast?.({ type: 'join', message: `${data.userName} joined the room` });
      }
    };

    // ── Incoming: user_left ────────────────────────────────────────────────
    const onUserLeft = (data) => {
      if (!mountedRef.current) return;
      if (data.email !== user.email) {
        onToast?.({ type: 'leave', message: `${data.userName} left the room` });
      }
      // Remove from typing list if they leave
      setTypingUsers(prev => prev.filter(u => u !== data.userName));
    };

    // ── Incoming: typing_indicator ─────────────────────────────────────────
    const onTypingIndicator = (data) => {
      if (!mountedRef.current) return;
      if (data.email === user.email) return; // ignore own typing indicator

      setTypingUsers(prev => {
        if (data.typing) {
          // Add if not already in list
          return prev.includes(data.userName) ? prev : [...prev, data.userName];
        } else {
          // Remove when typing stops
          return prev.filter(u => u !== data.userName);
        }
      });
    };

    // ── Register all listeners ─────────────────────────────────────────────
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_indicator', onTypingIndicator);

    // ── Cleanup: remove listeners and emit leave_room on unmount ──────────
    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_indicator', onTypingIndicator);

      // Clear any pending typing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [roomId, user]); // re-register if roomId or user changes

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Sends a message to the room via socket.
   * The server will save it to MongoDB and broadcast it back to the room.
   */
  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (!socket || !text?.trim()) return;

    socket.emit('send_message', {
      roomId,
      message: text.trim(),
      senderName: user?.fullName,
    });

    // Stop typing indicator when message is sent
    stopTyping();
  }, [roomId, user]);

  /**
   * Emits typing_start (debounced — only emits once until stopTyping is called).
   */
  const startTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    // Only emit if not already flagged as typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { roomId, userName: user?.fullName });
    }

    // Auto-stop typing after 3 seconds of inactivity
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 3000);
  }, [roomId, user]);

  /**
   * Emits typing_stop and resets the typing flag.
   */
  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing_stop', { roomId, userName: user?.fullName });
    }
    clearTimeout(typingTimerRef.current);
  }, [roomId, user]);

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    loading,
  };
}
