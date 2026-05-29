import api from './api';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // Returns AuthResponse { token, email, fullName }
};

export const registerUser = async (fullName, email, password) => {
  const response = await api.post('/auth/register', { fullName, email, password });
  return response.data; // Returns AuthResponse { token, email, fullName }
};
