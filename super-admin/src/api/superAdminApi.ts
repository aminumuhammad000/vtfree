import axios from 'axios';

const API_URL = 'http://localhost:5000/api/super-admin';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor (placeholder for now)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('super_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDashboardStats = async () => {
  return api.get('/dashboard');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return api.get('/users', { params });
};

export const updateUserStatus = (id: string, status: string) =>
  api.put(`/users/${id}/status`, { status });
export const approveKyc = (id: string) => api.put(`/users/${id}/kyc/approve`);
export const rejectKyc = (id: string, reason: string) =>
  api.put(`/users/${id}/kyc/reject`, { reason });
