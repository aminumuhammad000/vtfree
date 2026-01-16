import axios from 'axios';

<<<<<<< HEAD
const API_URL = 'http://localhost:5000/api/v1/super-admin';
=======
const API_URL = 'http://localhost:5000/api/super-admin';
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf

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
  app_id?: string;
  owner_id?: string;
}) => {
  return api.get('/users', { params });
};

export const getApps = async () => {
  return api.get('/apps');
};

// This will fetch VTfreeUsers who are app owners
export const getOwners = async () => {
  // We can reuse the users endpoint if we add a type filter, or just use a new one.
  // For now, let's assume we want all VTfreeUsers.
  // Actually, let's check if there's an endpoint for this.
  return api.get('/owners');
};

export const updateUserStatus = (id: string, status: string) =>
  api.put(`/users/${id}/status`, { status });
export const approveKyc = (id: string) => api.put(`/users/${id}/kyc/approve`);
export const rejectKyc = (id: string, reason: string) =>
  api.put(`/users/${id}/kyc/reject`, { reason });

<<<<<<< HEAD
export const getTransactions = async (params?: any) => {
  return api.get('/transactions', { params });
=======
export const getTransactions = async () => {
  return api.get('/transactions');
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
};

export const getPayments = async () => {
  return api.get('/payments');
};

export const getWallets = async () => {
  return api.get('/wallets');
};

export const getWithdrawals = async () => {
  return api.get('/withdrawals');
};

export const updateWithdrawalStatus = async (id: string, status: string, reason?: string) => {
  return api.patch(`/withdrawals/${id}/status`, { status, reason });
};

// Plans
export const getPlans = async () => {
  return api.get('/plans');
};

export const createPlan = async (data: any) => {
  return api.post('/plans', data);
};

export const updatePlan = async (id: string, data: any) => {
  return api.patch(`/plans/${id}`, data);
};

export const deletePlan = async (id: string) => {
  return api.delete(`/plans/${id}`);
};

// Features
export const getFeatures = async () => {
  return api.get('/features');
};

export const createFeature = async (data: any) => {
  return api.post('/features', data);
};

export const updateFeature = async (id: string, data: any) => {
  return api.patch(`/features/${id}`, data);
};

export const deleteFeature = async (id: string) => {
  return api.delete(`/features/${id}`);
};

export const getSystemSettings = async () => {
  return api.get('/settings');
};

export const updateSystemSettings = async (settings: any) => {
  return api.patch('/settings', settings);
};

export const getLogs = async (type?: string) => {
  return api.get('/logs', { params: { type } });
};

export const getTickets = async () => {
  return api.get('/tickets');
};

export const updateTicketStatusApi = async (id: string, status: string, priority?: string) => {
  return api.patch(`/tickets/${id}/status`, { status, priority });
};

<<<<<<< HEAD
// VTPay
export const getVTPaySettings = async () => api.get('/vtpay/settings');
export const updateVTPaySettings = async (data: any) => api.post('/vtpay/settings', data);
export const getVTPayPlatformBalance = async () => api.get('/vtpay/balance');
export const getVTPayAccounts = async () => api.get('/vtpay/accounts');
export const createVTPayAccount = async (data: any) => api.post('/vtpay/accounts', data);
export const getVTPayAccountBalance = async (accountNumber: string) => api.get(`/vtpay/accounts/${accountNumber}/balance`);
export const getVTPayAccountTransactions = async (accountNumber: string) => api.get(`/vtpay/accounts/${accountNumber}/transactions`);

=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
const superAdminApi = {
  getDashboardStats,
  getUsers,
  getApps,
  getOwners,
  getTransactions,
  getPayments,
  getWallets,
  getWithdrawals,
  updateWithdrawalStatus,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  updateUserStatus,
  approveKyc,
  rejectKyc,
  getSystemSettings,
  updateSystemSettings,
  getLogs,
  getTickets,
  updateTicketStatus: updateTicketStatusApi,
<<<<<<< HEAD
  getVTPaySettings,
  updateVTPaySettings,
  getVTPayPlatformBalance,
  getVTPayAccounts,
  createVTPayAccount,
  getVTPayAccountBalance,
  getVTPayAccountTransactions,
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
};

export default superAdminApi;
