import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfilePicture: (formData) => api.post('/users/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  updateTheme: (data) => api.put('/users/theme', data),
  updateNotifications: (data) => api.put('/users/notifications', data)
};

export const preferenceAPI = {
  save: (data) => api.post('/preferences', data),
  get: () => api.get('/preferences'),
  check: () => api.get('/preferences/check')
};

export const noteAPI = {
  create: (data) => api.post('/notes', data),
  getAll: (params) => api.get('/notes', { params }),
  getSaved: () => api.get('/notes/saved'),
  get: (id) => api.get(`/notes/${id}`),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  save: (id) => api.put(`/notes/${id}/save`)
};

export const reviewerAPI = {
  generate: (data) => api.post('/reviewers/generate', data),
  getAll: () => api.get('/reviewers'),
  get: (id) => api.get(`/reviewers/${id}`),
  delete: (id) => api.delete(`/reviewers/${id}`),
  formulas: (data) => api.post('/reviewers/formulas', data),
  keyTerms: (data) => api.post('/reviewers/key-terms', data)
};

export const pdfAPI = {
  upload: (formData) => api.post('/pdf/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  process: (id) => api.post(`/pdf/${id}/process`),
  getAll: () => api.get('/pdf'),
  get: (id) => api.get(`/pdf/${id}`),
  delete: (id) => api.delete(`/pdf/${id}`)
};

export const quizAPI = {
  generate: (data) => api.post('/quizzes/generate', data),
  submit: (data) => api.post('/quizzes/submit', data),
  getAll: (params) => api.get('/quizzes', { params }),
  get: (id) => api.get(`/quizzes/${id}`),
  getStats: () => api.get('/quizzes/stats'),
  getWeakTopics: () => api.get('/quizzes/weak-topics'),
  generateAdaptive: (data) => api.post('/quizzes/adaptive', data)
};

export const flashcardAPI = {
  generate: (data) => api.post('/flashcards/generate', data),
  create: (data) => api.post('/flashcards', data),
  getAll: (params) => api.get('/flashcards', { params }),
  getDue: () => api.get('/flashcards/due'),
  getStats: () => api.get('/flashcards/stats'),
  get: (id) => api.get(`/flashcards/${id}`),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
  toggleFavorite: (id) => api.put(`/flashcards/${id}/favorite`),
  review: (id, data) => api.post(`/flashcards/${id}/review`, data)
};

export const studyAPI = {
  logActivity: (data) => api.post('/study/log', data),
  getHistory: (params) => api.get('/study/history', { params }),
  getTodayStats: () => api.get('/study/today'),
  getWeeklyStats: () => api.get('/study/weekly'),
  getMonthlyStats: () => api.get('/study/monthly'),
  getDailyStats: (params) => api.get('/study/daily', { params }),
  getTotalStats: () => api.get('/study/total')
};

export const breakAPI = {
  recommend: (data) => api.post('/breaks/recommend', data),
  getAll: () => api.get('/breaks'),
  markTaken: (id, data) => api.put(`/breaks/${id}/taken`, data),
  getEffectiveness: () => api.get('/breaks/effectiveness')
};

export const streakAPI = {
  update: () => api.post('/streaks/update'),
  get: () => api.get('/streaks')
};

export const achievementAPI = {
  getAll: () => api.get('/achievements'),
  check: () => api.post('/achievements/check')
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  create: (data) => api.post('/notifications', data),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const analyticsAPI = {
  getDashboardData: () => api.get('/analytics/dashboard'),
  getStudyTimeTrend: (params) => api.get('/analytics/study-time', { params }),
  getQuizPerformance: () => api.get('/analytics/quiz-performance'),
  getFocusTrend: () => api.get('/analytics/focus'),
  getStreakGrowth: () => api.get('/analytics/streak-growth'),
  getBreakEffectiveness: () => api.get('/analytics/break-effectiveness'),
  getLearningProgress: () => api.get('/analytics/learning-progress'),
  getMetrics: () => api.get('/analytics/metrics')
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getQuizStats: () => api.get('/admin/quiz-stats'),
  getUserReports: () => api.get('/admin/user-reports'),
  deleteNote: (id) => api.delete(`/admin/notes/${id}`)
};

export const searchAPI = {
  search: (params) => api.get('/search', { params })
};

export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/gamification/leaderboard', { params }),
  getRanking: () => api.get('/gamification/ranking'),
  getLevelInfo: () => api.get('/gamification/level'),
  getXpHistory: () => api.get('/gamification/xp-history'),
  checkLevelUp: () => api.post('/gamification/check-level-up')
};

export const pomodoroAPI = {
  saveSession: (data) => api.post('/pomodoro/sessions', data),
  getSessions: () => api.get('/pomodoro/sessions'),
  getAdaptiveSettings: () => api.get('/pomodoro/adaptive-settings'),
  saveFocusScore: (data) => api.post('/pomodoro/focus-score', data)
};

export default api;
