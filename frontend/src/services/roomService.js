import api from './api';

/**
 * roomService.js
 * All study room API calls using the shared Axios instance (with JWT auto-injection).
 */

// ─── Fetch all active rooms (Browse/Discover) ─────────────────────────────────
export const getAllRooms = () => api.get('/rooms');

// ─── Fetch a single room's details ────────────────────────────────────────────
export const getRoomById = (roomId) => api.get(`/rooms/${roomId}`);

// ─── Fetch rooms the user has joined ─────────────────────────────────────────
export const getMyRooms = () => api.get('/rooms/my');

// ─── Fetch rooms the user has created ────────────────────────────────────────
export const getCreatedRooms = () => api.get('/rooms/created');

// ─── Create a new study room ─────────────────────────────────────────────────
export const createRoom = (data) => api.post('/rooms', data);
// data shape: { roomName, description, subject }

// ─── Join an existing study room ─────────────────────────────────────────────
export const joinRoom = (roomId) => api.post(`/rooms/${roomId}/join`);

// ─── Leave a study room ───────────────────────────────────────────────────────
export const leaveRoom = (roomId) => api.post(`/rooms/${roomId}/leave`);

// ─── Delete a room (creator only, soft-delete) ────────────────────────────────
export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`);
