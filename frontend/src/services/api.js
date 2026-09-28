import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (credential) => api.post('/auth/google', { token: credential }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
};

export const videoAPI = {
  addToHistory: (meetingCode) => api.post('/video/history', { meeting_code: meetingCode }),
  getHistory: () => api.get('/video/history')
};

// Colleges API
export const collegesAPI = {
  getAll: () => api.get('/colleges'),
  getById: (id) => api.get(`/colleges/${id}`)
};

// Resources API
export const resourcesAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`)
};

// Posts API
export const postsAPI = {
  getAll: (groupId) => api.get('/posts', { params: { groupId } }),
  getById: (id) => api.get(`/posts/${id}`),
  getMentionCandidates: (postId) => api.get(`/posts/${postId}/mention-candidates`),
  create: (data) => api.post('/posts', data),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  togglePin: (id) => api.post(`/posts/${id}/pin`),
  report: (id, reason) => api.post(`/posts/${id}/report`, { reason }),
  delete: (id) => api.delete(`/posts/${id}`)
};

// Community Groups API
export const communityGroupsAPI = {
  getAll: (params) => api.get('/community-groups', { params }),
  getById: (id) => api.get(`/community-groups/${id}`),
  join: (id) => api.post(`/community-groups/${id}/join`),
  leave: (id) => api.post(`/community-groups/${id}/leave`),
  create: (data) => api.post('/community-groups', data),
  update: (id, data) => api.put(`/community-groups/${id}`, data)
};

// Comments API
export const commentsAPI = {
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  reply: (postId, parentCommentId, data) =>
    api.post(`/posts/${postId}/comments`, { ...data, parentCommentId }),
  delete: (id) => api.delete(`/posts/comments/${id}`)
};

// Chat API
export const chatAPI = {
  getSession: () => api.get('/chat/session'),
  sendMessage: (content) => api.post('/chat/message', { content }),
  closeSession: (sessionId) => api.post(`/chat/session/${sessionId}/close`),
  getHistory: () => api.get('/chat/history')
};

// Connect API (Renamed from Bookings)
export const connectAPI = {
  bookSession: (data) => api.post('/connect/book', data),
  getStudentBookings: () => api.get('/connect/student'),
  getCounselorBookings: (status) => api.get('/connect/counselor', { params: { status } }),
  getCounselors: () => api.get('/connect/counselors'),
  getAvailability: (counselorId) => api.get(`/connect/counselors/${counselorId}/availability`),
  setAvailability: (data) => api.post('/connect/availability', data),
  updateStatus: (bookingId, data) => api.put(`/connect/${bookingId}/status`, data),
  deleteSlot: (bookingId) => api.delete(`/connect/${bookingId}`),
  getInsights: (studentId) => api.get(`/connect/insights/${studentId}`)
};

// Notification API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read')
};

// Admin API
export const adminAPI = {
  getAllUsers: (role) => api.get('/admin/users', { params: { role } }),
  updateUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, { isActive }),
  getFlaggedPosts: () => api.get('/admin/posts/flagged'),
  dismissFlaggedPost: (id) => api.put(`/admin/posts/${id}/dismiss`),
  getFlaggedChatSessions: () => api.get('/admin/chat/flagged'),
  resolveChatSession: (id) => api.put(`/admin/chat/${id}/resolve`),
  getDashboardStats: () => api.get('/admin/stats')
};

// Assessment / Check-In API
export const assessmentAPI = {
  submitFlow: (answers, isOnboarding = false) =>
    api.post('/assessments/submit-flow', { answers, isOnboarding }),
  submitResult: (payload) => api.post('/assessments/results', payload),
  getMyResults: () => api.get('/assessments/results'),
  deleteResult: (id) => api.delete(`/assessments/results/${id}`),
};

export default api;
