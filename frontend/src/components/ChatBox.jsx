import React, { useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

/**
 * ChatBox — Full interactive chat panel integrating live room channels,
 * message streaming, active typing, and message history persistence.
 *
 * @param {string} roomId — Study Room Identifier
 * @param {object} currentUser — Logged-in user context
 * @param {function} onToast — Hook for displaying notifications
 * @param {boolean} connected — Socket connection status
 */
export default function ChatBox({ roomId, currentUser, onToast, connected = false }) {
  const {
    messages = [],
    typingUsers = [],
    sendMessage,
    startTyping,
    stopTyping,
    loading,
  } = useChat(roomId, currentUser, onToast);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-scroll logic: scroll on new message OR initial history load
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Use instant scroll for initial load, smooth scroll for live updates
      scrollToBottom(messages.length <= 50 ? 'auto' : 'smooth');
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-slate-950/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* Chat Title / Connection Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-sm tracking-wide">Room Chat</h4>
          <div className="flex items-center gap-1.5 mt-0.5 select-none">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-pulse'}`}></span>
            <p className={`text-[10px] font-medium tracking-wide ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connected ? 'Realtime Connected' : 'Connecting to Server…'}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full font-semibold select-none">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Scroll Panel */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow p-5 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500 select-none">
            <span className="animate-spin text-2xl text-indigo-500">⏳</span>
            <p className="text-xs font-semibold tracking-wider">LOADING CHAT HISTORY…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 border border-dashed border-slate-800/60 rounded-xl m-2 select-none">
            <span className="text-2xl mb-1">💬</span>
            <p className="text-xs font-bold text-slate-400">Welcome to the Room!</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Send a message to start compiling notes.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id || index} 
              message={msg} 
              currentUser={currentUser} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Live typing status indicators */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Interactive Input Form */}
      <ChatInput 
        onSendMessage={sendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  );
}
