import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/super-admin'; // 'https://api.vtfree.com.ng/api/v1/super-admin';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
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

export const createApp = async (data: any) => {
  return api.post('/apps', data);
};

// This will fetch VTfreeUsers who are app owners
export const getOwners = async () => {
  return api.get('/owners');
};
export const getOwner = (id: string) => api.get(`/owners/${id}`);
export const updateOwner = (id: string, data: any) => api.put(`/owners/${id}`, data);
export const deleteOwner = (id: string) => api.delete(`/owners/${id}`);
export const getAdmins = () => api.get('/admins');
export const getAdmin = (id: string) => api.get(`/admins/${id}`);
export const updateAdmin = (id: string, data: any) => api.put(`/admins/${id}`, data);
export const deleteAdmin = (id: string) => api.delete(`/admins/${id}`);

export const updateUserStatus = (id: string, status: string) =>
  api.put(`/users/${id}/status`, { status });
export const approveKyc = (id: string) => api.put(`/users/${id}/kyc/approve`);
export const rejectKyc = (id: string, reason: string) =>
  api.put(`/users/${id}/kyc/reject`, { reason });

export const creditOwnerWallet = (id: string, amount: number, reason: string) =>
  api.post(`/owners/${id}/credit`, { amount, reason });

export const getTransactions = async (params?: any) => {
  return api.get('/transactions', { params });
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

// VTPay
export const getVTPaySettings = async () => api.get('/vtpay/settings');
export const updateVTPaySettings = async (data: any) => api.post('/vtpay/settings', data);
export const getVTPayPlatformBalance = async () => api.get('/vtpay/balance');
export const getVTPayAccounts = async () => api.get('/vtpay/accounts');
export const createVTPayAccount = async (data: any) => api.post('/vtpay/accounts', data);
export const getVTPayAccountBalance = async (accountNumber: string) => api.get(`/vtpay/accounts/${accountNumber}/balance`);
export const getVTPayAccountTransactions = async (accountNumber: string) => api.get(`/vtpay/accounts/${accountNumber}/transactions`);

const superAdminApi = {
  getDashboardStats,
  getUsers,
  getApps,
  createApp,
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
  approveKyc,
  rejectKyc,
  getSystemSettings,
  updateSystemSettings,
  getLogs,
  getTickets,
  updateTicketStatus: updateTicketStatusApi,
  getVTPaySettings,
  updateVTPaySettings,
  getVTPayPlatformBalance,
  getVTPayAccounts,
  createVTPayAccount,
  getVTPayAccountBalance,
  getVTPayAccountTransactions,
  getOwner,
  updateOwner,
  deleteOwner,
  getAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  updateUserStatus,
  creditOwnerWallet,
};

export default superAdminApi;
