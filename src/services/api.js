import axios from 'axios';

const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://fixam-backend-production.up.railway.app/api';
};

const API_BASE_URL = getApiUrl();
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send HttpOnly cookies with every request
});

// Add a request interceptor for logging
api.interceptors.request.use(config => {
  console.log(`[Dashboard API] Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  return Promise.reject(error);
});

// Add a response interceptor for logging
api.interceptors.response.use(response => {
  console.log(`[Dashboard API] Response: ${response.status} from ${response.config.url}`);
  return response;
}, error => {
  console.error(`[Dashboard API] Error:`, error.response?.status, error.message);
  if (typeof window !== 'undefined' && error.response?.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    if (window.location.pathname !== '/') {
      window.location.replace('/');
    }
  }
  return Promise.reject(error);
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardService = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getFinancialStats: () => api.get('/admin/financial-stats'),
  getBroadcasts: () => api.get('/admin/broadcasts'),
  getUsers: () => api.get('/admin/users'),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getProviders: () => api.get('/admin/providers'),
  verifyProvider: (data) => api.post('/admin/verify-provider', data),
  approveTransaction: (data) => api.post('/admin/approve-transaction', data),
  getPendingTransactions: () => api.get('/admin/pending-transactions'),
  getTransactions: () => api.get('/admin/transactions'),
  getReports: () => api.get('/admin/reports'),
  updateReportStatus: (id, data) => api.put(`/admin/reports/${id}/status`, data),
  getFeedback: () => api.get('/admin/feedback'),
  updateFeedbackStatus: (id, data) => api.put(`/admin/feedback/${id}/status`, data),
  sendAdminMessage: (data) => api.post('/admin/messages', data),
  uploadProfileImage: (data) => api.post('/upload/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile: (data) => api.put('/users/profile', data),
  getPendingJobs: () => api.get('/admin/pending-jobs'),
  approveJob: (id) => api.put(`/admin/jobs/${id}/approve`),
  rejectJob: (id, data) => api.put(`/admin/jobs/${id}/reject`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getWalletStats: () => api.get('/admin/wallet/stats'),
  wireCoins: (data) => api.post('/admin/wallet/wire-coins', data),
  getWireHistory: () => api.get('/admin/wallet/wire-history'),
  sendBroadcastEmail: (data) => api.post('/admin/broadcast-email', data),
  sendSecurityAlert: (data) => api.post('/admin/security-alert', data),
  getJobs: () => api.get('/jobs/all'),
  getBookings: () => api.get('/admin/bookings'),
  getSupportConversations: () => api.get('/admin/support-conversations', { params: { _t: Date.now() } }),
  getConversations: () => api.get('/chat/conversations', { params: { _t: Date.now() } }),
  getConversationById: (id) => api.get(`/chat/conversations/${id}`),
  createConversation: (data) => api.post('/chat/conversations', data),
  getChatMessages: (conversationId) => api.get(`/chat/${conversationId}/messages`),
  markConversationRead: (conversationId) => api.put(`/chat/${conversationId}/read`),
  getUnreadMessageCount: () => api.get('/chat/unread-count'),
  sendChatMessage: (data) => api.post('/chat/send', data),
  getConversationBetweenUsers: (user1Id, user2Id) => api.get(`/admin/conversations/between/${user1Id}/${user2Id}`),
};

export default api;
