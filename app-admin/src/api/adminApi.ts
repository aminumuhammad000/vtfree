import api, { generalApi } from './axios';

// Auth
export const login = (data: { email: string; password: string }) =>
  api.post('/login', data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard');

// Admin Management
export const createAdminUser = (data: { email: string; first_name: string; last_name: string; password: string }) =>
  api.post('/admins', data);
export const getAllAdmins = (params?: { page?: number; limit?: number }) =>
  api.get('/admins', { params });

// Users
export const getUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/users', { params });
export const getUser = (id: string) => api.get(`/users/${id}`);
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data);
export const updateUserStatus = (id: string, status: string) =>
  api.put(`/users/${id}/status`, { status });
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const creditUserWallet = (userId: string, amount: number, description: string) =>
  api.post('/wallet/credit', { userId, amount, description });

// Audit Logs
export const getAuditLogs = (params?: { page?: number; limit?: number }) =>
  api.get('/audit-logs', { params });
export const deleteAuditLog = (id: string) => api.delete(`/audit-logs/${id}`);

// Pricing Management
export const getPricingPlans = (params?: { page?: number; limit?: number; providerId?: number; type?: string; active?: boolean }) =>
  api.get('/pricing', { params });
export const getPricingPlanById = (id: string) => api.get(`/pricing/${id}`);
export const getPlansByProvider = (providerId: number, type?: string) =>
  api.get(`/pricing/provider/${providerId}`, { params: { type } });
export const createPricingPlan = (data: any) =>
  api.post('/pricing', data);
export const updatePricingPlan = (id: string, data: any) =>
  api.put(`/pricing/${id}`, data);
export const deletePricingPlan = (id: string) =>
  api.delete(`/pricing/${id}`);
export const bulkImportPricingPlans = (plans: any[]) =>
  api.post('/pricing/bulk-import', { plans });

// Providers (Bill payment API providers)
export const getProviders = (params?: { active?: boolean }) =>
  api.get('/providers', { params });
export const getProviderById = (id: string) => api.get(`/providers/${id}`);
export const createProvider = (data: any) => api.post('/providers', data);
export const updateProvider = (id: string, data: any) => api.put(`/providers/${id}`, data);
export const deleteProvider = (id: string) => api.delete(`/providers/${id}`);
export const getProviderEnv = (id: string) => api.get(`/providers/${id}/env`);
export const updateProviderEnv = (id: string, env: Record<string, string>) => api.put(`/providers/${id}/env`, { env });
export const testProviderConnection = (code: string) => api.post(`/providers/test/${code}`);
export const getProviderData = (code: string, type: 'balance' | 'networks' | 'plans') =>
  api.get(`/providers/data/${code}`, { params: { type } });

// Funding & Provider Balances
export const getProviderBalances = () => api.get('/providers/balances');
export const getFundingInfo = () => api.get('/funding/info');
export const getFundingAccounts = () => api.get('/funding/accounts');
export const createFundingAccount = (data: { bankName: string; accountName: string; accountNumber: string; instructions?: string; active?: boolean }) =>
  api.post('/funding/accounts', data);
export const updateFundingAccount = (id: string, data: Partial<{ bankName: string; accountName: string; accountNumber: string; instructions?: string; active?: boolean }>) =>
  api.put(`/funding/accounts/${id}`, data);
export const deleteFundingAccount = (id: string) => api.delete(`/funding/accounts/${id}`);

// Transactions
export const getTransactions = (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
  generalApi.get('/transactions/all', { params });
export const getTransactionById = (id: string) => generalApi.get(`/transactions/${id}`);

// Admin Profile
export const updateAdminProfile = (data: { first_name?: string; last_name?: string; email?: string }) =>
  api.put('/profile', data);
export const changeAdminPassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put('/profile/password', data);

// Support Content
export const getSupportContent = () => api.get('/support-content');
export const updateSupportContent = (data: any) => api.put('/support-content', data);

// Notifications
export const sendBroadcastNotification = (data: { title: string; message: string; type: string; action_link?: string }) =>
  api.post('/notifications/broadcast', data);
