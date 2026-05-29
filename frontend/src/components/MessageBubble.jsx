import React from 'react';

/**
 * MessageBubble — Renders an individual chat message.
 * Supports system messages, sender vs receiver styling, and premium Discord-like aesthetics.
 *
 * @param {object} message — The ChatMessage object { id, roomId, message, senderName, senderEmail, timestamp, isSystem }
 * @param {object} currentUser — Currently logged-in user context
 */
export default function MessageBubble({ message, currentUser }) {
  const { id, senderName, senderEmail, message: text, timestamp, isSystem } = message;

  // Handle system messages (e.g. user joined, left, room creation)
  if (isSystem) {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <span className="text-[10px] text-indigo-300 bg-indigo-950/40 px-3.5 py-1.5 rounded-full border border-indigo-900/40 shadow-sm backdrop-blur-sm select-none max-w-[90%] text-center">
          {text}
        </span>
      </div>
    );
  }

  const isMe = currentUser && senderEmail === currentUser.email;

  // Format timestamp (e.g. "4:32 PM" or "Yesterday")
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      // Fallback if invalid date
      if (isNaN(date.getTime())) return timeStr;
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className={`flex gap-3 group animate-fade-in py-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* User Avatar */}
      <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 select-none ${
        isMe 
          ? 'from-indigo-500 to-violet-600 shadow-indigo-500/10' 
          : 'from-dark-600 to-dark-700 border border-slate-700/50'
      }`}>
        {getInitials(senderName)}
      </div>

      {/* Message Content Area */}
      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        
        {/* Name and Time */}
        <div className="flex items-baseline gap-2 mb-1 px-1">
          <span className={`text-[11px] font-bold tracking-wide ${isMe ? 'text-indigo-300' : 'text-slate-300'}`}>
            {isMe ? 'You' : senderName}
          </span>
          <span className="text-[9px] text-slate-500 select-none">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Message bubble */}
        <div className={`px-4 py-2.5 text-xs leading-relaxed break-words shadow-md transition-all duration-200 ${
          isMe
            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl rounded-tr-none border border-indigo-500/10 hover:shadow-indigo-500/10'
            : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-2xl rounded-tl-none hover:border-slate-700/80 hover:bg-slate-900'
        }`}>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
}
