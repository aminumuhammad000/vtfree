import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/super-admin';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUsers = async (_params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  // Mock data for now until backend is ready
  return {
    data: {
      data: [
        {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          status: 'active',
          kyc_status: 'verified',
          created_at: '2023-01-01T00:00:00Z',
          apps_count: 2,
          wallet_balance: 5000,
        },
        {
          _id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '0987654321',
          status: 'suspended',
          kyc_status: 'pending',
          created_at: '2023-02-15T00:00:00Z',
          apps_count: 1,
          wallet_balance: 1200,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
    },
  };
  // return api.get('/users', { params });
};

export const updateUserStatus = (id: string, status: string) =>
  api.put(`/users/${id}/status`, { status });
export const approveKyc = (id: string) => api.put(`/users/${id}/kyc/approve`);
export const rejectKyc = (id: string, reason: string) =>
  api.put(`/users/${id}/kyc/reject`, { reason });
