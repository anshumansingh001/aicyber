import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, name: string) => api.post('/api/auth/register', { email, password, name }),
  refresh: (refreshToken: string) => api.post('/api/auth/refresh', { refreshToken }),
  changePassword: (oldPassword: string, newPassword: string) => api.post('/api/auth/change-password', { oldPassword, newPassword }),
};

// Security
export const securityAPI = {
  assessDevice: (data: Record<string, unknown>) => api.post('/api/security/device/assess', data),
  detectThreats: (data: Record<string, unknown>) => api.post('/api/security/threats/detect', data),
  scanVulnerabilities: (data: Record<string, unknown>) => api.post('/api/security/vulnerabilities/scan', data),
  getPosture: () => api.get('/api/security/posture/assess'),
  getMonitoring: () => api.get('/api/security/monitoring/status'),
};

// AI Security
export const aiAPI = {
  anomalyDetection: (data: Record<string, unknown>) => api.post('/api/ai-security/anomaly-detection', data),
  nlpAnalysis: (text: string) => api.post('/api/ai-security/nlp-analysis', { text }),
  predictiveAnalytics: (data: unknown[]) => api.post('/api/ai-security/predictive-analytics', { historicalData: data }),
  getStatus: () => api.get('/api/ai-security/status'),
};

// Compliance
export const complianceAPI = {
  getStatus: () => api.get('/api/compliance/status'),
  getReport: (framework: string) => api.get(`/api/compliance/report/${framework}`),
  getGaps: () => api.get('/api/compliance/gaps'),
};

// Analytics
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getEventsTimeline: (days?: number) => api.get(`/api/analytics/events/timeline?days=${days || 30}`),
  getThreatsByType: () => api.get('/api/analytics/threats/by-type'),
  getAIPerformance: () => api.get('/api/analytics/ai/performance'),
  getScansSummary: () => api.get('/api/analytics/scans/summary'),
};

// Incidents
export const incidentAPI = {
  list: (page?: number, status?: string) => api.get('/api/incidents', { params: { page, status } }),
  get: (id: string) => api.get(`/api/incidents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/incidents', data),
  updateStatus: (id: string, status: string) => api.put(`/api/incidents/${id}/status`, { status }),
  addNote: (id: string, content: string) => api.post(`/api/incidents/${id}/notes`, { content }),
};

// Users
export const userAPI = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data: Record<string, unknown>) => api.put('/api/users/me', data),
  list: (page?: number) => api.get('/api/users', { params: { page } }),
};

// Health
export const healthAPI = {
  check: () => api.get('/health'),
  detailed: () => api.get('/health/detailed'),
};

export default api;
