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

  sendMessage: (coupleId, content, clientTempId) =>
    API.post('/chat/send', { coupleId, content, clientTempId }),

  sendMediaMessage: (coupleId, file, type, content = '') => {
    const formData = new FormData();
    formData.append('coupleId', coupleId);
    formData.append('media', file);
    formData.append('type', type);
    if (content) formData.append('content', content);
    return API.post('/chat/send-media', formData);
  },

  markRead: (coupleId) =>
    API.put(`/chat/mark-read/${coupleId}`),

  getUnreadCount: (coupleId) =>
    API.get(`/chat/unread-count/${coupleId}`),

  reactToMessage: (messageId, emoji) =>
    API.put(`/chat/message/${messageId}/react`, { emoji }),

  editMessage: (messageId, content) =>
    API.put(`/chat/message/${messageId}`, { content }),

  deleteMessage: (messageId) =>
    API.delete(`/chat/message/${messageId}`),

  // Memories
  getMemories: (coupleId) =>
    API.get(`/memories/${coupleId}`),

  createMemory: (payload) =>
    API.post('/memories', payload),

  uploadMemory: (formData) =>
    API.post('/memories/upload', formData),

  heartMemory: (memoryId) =>
    API.put(`/memories/${memoryId}/heart`),

  deleteMemory: (memoryId) =>
    API.delete(`/memories/${memoryId}`),

  clearMemories: (coupleId) =>
    API.delete(`/memories/couple/${coupleId}`),

  // Diary
  getDiaryEntry: (coupleId, date) =>
    API.get(`/diary/${coupleId}`, { params: { date } }),

  updateDiaryContent: (coupleId, payload) =>
    API.put(`/diary/${coupleId}`, payload),

  addDiaryComment: (coupleId, payload) =>
    API.post(`/diary/${coupleId}/comment`, payload),

  moveDiaryComment: (coupleId, commentId, payload) =>
    API.put(`/diary/${coupleId}/comment/${commentId}/move`, payload),

  // Shared Bucket List
  getBucketListItems: () =>
    API.get('/bucketlist'),

  createBucketListItem: (payload) =>
    API.post('/bucketlist', payload),

  deleteBucketListItem: (itemId) =>
    API.delete(`/bucketlist/${itemId}`)
};

export { apiCall };
export default apiCall;
