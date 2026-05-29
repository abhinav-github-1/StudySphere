import React from 'react';

/**
 * TypingIndicator — Displays which users are currently typing in the room.
 * Includes a premium, smooth pulsing dot animation.
 *
 * @param {string[]} typingUsers — List of usernames currently typing
 */
export default function TypingIndicator({ typingUsers = [] }) {
  if (typingUsers.length === 0) return null;

  let text = '';
  if (typingUsers.length === 1) {
    text = `${typingUsers[0]} is typing`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
  } else {
    text = 'Multiple people are typing';
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-slate-400 text-xs select-none">
      {/* Animated Blinking Dots */}
      <div className="flex items-center gap-1 bg-slate-900/60 px-2.5 py-1.5 rounded-full border border-slate-800/80">
        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-[bounce_1s_infinite_100ms]"></span>
        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-[bounce_1s_infinite_200ms]"></span>
        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-[bounce_1s_infinite_300ms]"></span>
      </div>
      <span className="font-medium animate-pulse text-[11px]">{text}…</span>
    </div>
  );
}
