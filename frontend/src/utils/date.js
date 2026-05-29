/**
 * date.js — Centralized date and time formatting utilities.
 * Reduces AI-style inline date parsing copy-pastes across various React pages.
 */

/**
 * Formats an ISO date string into a student-friendly clean representation.
 * Example: "May 29, 2026 6:46 PM"
 *
 * @param {string|Date} dateStr — ISO timestamp or Date object
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formats a timestamp into a shortened date representation.
 * Example: "May 29 6:46 PM"
 *
 * @param {string|Date} dateStr — ISO timestamp or Date object
 * @returns {string} Formatted short date and time
 */
export const formatShortDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formats seconds into MM:SS display for timers.
 * Example: 90 seconds -> "01:30"
 *
 * @param {number} totalSeconds — Duration in seconds
 * @returns {string} Formatted MM:SS string
 */
export const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats a duration in seconds into a human-readable string.
 * Example: 3665 seconds -> "1h 1m"
 *
 * @param {number} totalSeconds — Duration in seconds
 * @returns {string} Human-readable duration string
 */
export const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let res = '';
  if (hours > 0) res += `${hours}h `;
  if (minutes > 0 || hours > 0) res += `${minutes}m `;
  if (hours === 0 && minutes === 0) res += `${seconds}s`;
  return res.trim();
};
