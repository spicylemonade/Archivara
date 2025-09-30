import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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