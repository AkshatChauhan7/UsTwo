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

const apiCall = {
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
  generateInvite: () =>
    API.post('/couples/generate-invite'),

  acceptInvite: (inviteCode) =>
    API.post('/couples/accept-invite', { inviteCode }),

  getCoupleInfo: (coupleId) =>
    API.get(`/couples/info/${coupleId}`),

  getMyCouple: () =>
    API.get('/couples/my-couple'),

  disconnectCouple: () =>
    API.delete('/couples/disconnect'),

  // Chat
  getChatHistory: (coupleId, limit = 50, skip = 0) =>
    API.get(`/chat/history/${coupleId}`, { params: { limit, skip } }),

  sendMessage: (coupleId, content) =>
    API.post('/chat/send', { coupleId, content }),

  markRead: (coupleId) =>
    API.put(`/chat/mark-read/${coupleId}`),

  getUnreadCount: (coupleId) =>
    API.get(`/chat/unread-count/${coupleId}`),

  reactToMessage: (messageId, emoji) =>
    API.put(`/chat/message/${messageId}/react`, { emoji }),

  editMessage: (messageId, content) =>
    API.put(`/chat/message/${messageId}`, { content }),

  deleteMessage: (messageId) =>
    API.delete(`/chat/message/${messageId}`)
};

export { apiCall };
export default apiCall;
