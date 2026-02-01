import axios from 'axios';
import { Config } from '../config/Config';

const API_URL = Config.API_V1_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Virtual Accounts
export const getVirtualAccounts = (params?: any) => api.get('/virtual-accounts', { params });
export const freezeAccount = (id: string) => api.put(`/virtual-accounts/${id}/freeze`);
export const unfreezeAccount = (id: string) => api.put(`/virtual-accounts/${id}/unfreeze`);
export const syncAccount = (id: string) => api.post(`/virtual-accounts/${id}/sync`);

// Transfers
export const getTransfers = (params?: any) => api.get('/transfers', { params });
export const retryTransfer = (id: string) => api.post(`/transfers/${id}/retry`);
export const getTransferDetails = (id: string) => api.get(`/transfers/${id}`);

// Settlements
export const getSettlements = (params?: any) => api.get('/settlements', { params });
export const verifySettlement = (id: string) => api.post(`/settlements/${id}/verify`);

// Payment Logs
export const getPaymentLogs = (params?: any) => api.get('/webhooks/logs', { params });
export const replayWebhook = (id: string) => api.post(`/webhooks/${id}/replay`);

// Disputes
export const getDisputes = (params?: any) => api.get('/disputes', { params });
export const createDispute = (data: any) => api.post('/disputes', data);
export const resolveDispute = (id: string, resolution: any) => api.put(`/disputes/${id}/resolve`, resolution);

export default api;
