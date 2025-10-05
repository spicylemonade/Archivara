import axios from 'axios';

const defaultBaseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://archivara-production.up.railway.app/api/v1'
    : 'http://localhost:8000/api/v1';

// Ensure we always use HTTPS in production (but allow HTTP in dev)
const baseUrl = process.env.NEXT_PUBLIC_API_URL || defaultBaseUrl;
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? baseUrl.replace(/^http:/, 'https:')
  : baseUrl;

// Log API URL on client side for debugging
if (typeof window !== 'undefined') {
  console.log('[API] Using API_BASE_URL:', API_BASE_URL);
  console.log('[API] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('[API] NODE_ENV:', process.env.NODE_ENV);
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token but don't redirect
      // Pages can handle auth requirements individually
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const papersAPI = {
  list: (params?: any) => api.get('/papers', { params }),
  get: (id: string) => api.get(`/papers/${id}`),
  create: (data: FormData) => api.post('/papers', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => api.put(`/papers/${id}`, data),
  delete: (id: string) => api.delete(`/papers/${id}`),
};

export const searchAPI = {
  search: (query: string, filters?: any) => 
    api.post('/search', { query, ...filters }),
  suggest: (query: string) => 
    api.get('/search/suggest', { params: { q: query } }),
};

export const authAPI = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/users/me'),
};

export const ragAPI = {
  query: (question: string, context?: any) =>
    api.post('/rag/query', { question, context }),
};

export const mcpAPI = {
  listTools: () => api.get('/mcp/tools'),
  executeTool: (toolName: string, params: any) =>
    api.post(`/mcp/tools/${toolName}/execute`, params),
};

export const moderationAPI = {
  vote: (paperId: string, vote: number) =>
    api.post(`/moderation/papers/${paperId}/vote`, { vote }),
  flag: (paperId: string, reason: string, details?: string) =>
    api.post(`/moderation/papers/${paperId}/flag`, { reason, details }),
  getMyVote: (paperId: string) =>
    api.get(`/moderation/papers/${paperId}/my-vote`),
  getModerationStatus: (paperId: string) =>
    api.get(`/moderation/papers/${paperId}/moderation-status`),
};

export const authorsAPI = {
  get: (id: string) => api.get(`/authors/${id}`),
  search: (query?: string, limit?: number) =>
    api.get('/authors', { params: { query, limit } }),
}; 
