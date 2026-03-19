import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000
});

// Add token to requests
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error handling
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const apiCall = {
  // Auth
  signup: (email, password, name) =>
    API.post('/auth/signup', { email, password, name }),

  login: (email, password) =>
    API.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Couples
  generateInvite: (userId) =>
    API.post('/couples/generate-invite', { userId }),

  acceptInvite: (userId, inviteCode) =>
    API.post('/couples/accept-invite', { userId, inviteCode }),

  getCoupleInfo: (coupleId) =>
    API.get(`/couples/info/${coupleId}`),

  getMyCouple: (userId) =>
    API.get(`/couples/my-couple/${userId}`),

  // Chat
  getChatHistory: (coupleId, limit = 50, skip = 0) =>
    API.get(`/chat/history/${coupleId}`, { params: { limit, skip } }),

  sendMessage: (coupleId, senderId, content) =>
    API.post('/chat/send', { coupleId, senderId, content }),

  markRead: (coupleId) =>
    API.put(`/chat/mark-read/${coupleId}`)
};

export default apiCall;
