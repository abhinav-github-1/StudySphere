import React, { useState } from 'react';
import { createRoom } from '../services/roomService';

/**
 * CreateRoomModal - A modal dialog for creating a new study room.
 *
 * Props:
 *   isOpen    - boolean to control visibility
 *   onClose   - callback to close the modal
 *   onSuccess - callback after successful creation (triggers list refresh)
 */

const SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine',
  'Engineering',
  'Software Engineering',
  'History',
  'Economics',
  'Language',
  'Other',
];

export default function CreateRoomModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ roomName: '', description: '', subject: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomName.trim()) {
      setError('Room name is required.');
      return;
    }
    if (!form.subject) {
      setError('Please select a subject.');
      return;
    }

    setLoading(true);
    try {
      await createRoom(form);
      setForm({ roomName: '', description: '', subject: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking the backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>Create Study Room</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error-msg" role="alert">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="roomName">Room Name *</label>
            <input
              id="roomName"
              type="text"
              name="roomName"
              placeholder="e.g., Algorithms Deep Dive"
              value={form.roomName}
              onChange={handleChange}
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <select
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
            >
              <option value="">Select a subject…</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="What will this room focus on? (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={300}
            />
            <span className="char-count">{form.description.length}/300</span>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-create" disabled={loading}>
              {loading ? (
                <span className="btn-spinner">Creating…</span>
              ) : (
                '+ Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
