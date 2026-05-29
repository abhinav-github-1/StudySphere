import React, { useState, useRef, useEffect } from 'react';

/**
 * ChatInput — Premium input controls for composing and sending chat messages.
 * Integrates active typing detection to broadcast client activity.
 *
 * @param {function} onSendMessage — Handler to publish message content
 * @param {function} onStartTyping — Callback triggered when user begins composing
 * @param {function} onStopTyping — Callback triggered when user stops composing
 */
export default function ChatInput({ onSendMessage, onStartTyping, onStopTyping }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  // Trigger typing hooks on input change
  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      onStartTyping?.();
    } else {
      onStopTyping?.();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage?.(text.trim());
    setText('');
    onStopTyping?.();
    
    // Maintain input focus for continuous chatting
    inputRef.current?.focus();
  };

  // Ensure typing ceases when the input unmounts or loses focus
  useEffect(() => {
    return () => {
      onStopTyping?.();
    };
  }, [onStopTyping]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-3 border-t border-slate-800/80 bg-slate-950/80 rounded-b-2xl flex items-center gap-2"
    >
      {/* Decorative Plus Action */}
      <button 
        type="button"
        className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-900 transition flex-shrink-0 cursor-pointer"
        title="Add files (stub)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Message Input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={onStopTyping}
        placeholder="Send a message…"
        className="flex-grow bg-slate-900/90 text-xs text-white placeholder-slate-500 px-4 py-2.5 rounded-xl border border-slate-800/60 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 outline-none transition duration-150"
        maxLength={500}
      />

      {/* Decorative Emoji Stub */}
      <button 
        type="button"
        className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-900 transition flex-shrink-0 cursor-pointer"
        title="Insert Emoji (stub)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Send Submit Button */}
      <button
        type="submit"
        disabled={!text.trim()}
        className={`p-2.5 rounded-xl transition duration-150 flex-shrink-0 flex items-center justify-center cursor-pointer ${
          text.trim()
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
            : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}
