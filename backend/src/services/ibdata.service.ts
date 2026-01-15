import axios, { AxiosInstance } from 'axios';
import ProviderConfig from '../models/provider.model.js';
import logger from '../utils/logger.js';

interface IBDataPurchase {
    phone: string;
    network: string;
    plan?: string;
    amount: number;
    airtime_type?: 'VTU' | 'Share';
    ported_number?: boolean;
}

class IBDataService {
    private api: AxiosInstance | null = null;

    private async ensureClient(configOverride?: any) {
        if (!configOverride && this.api) return this.api;

        const cfg = configOverride || await ProviderConfig.findOne({ code: 'ibdata' });
        const baseURL = cfg?.base_url || 'https://api.ibdata.com.ng/api';
        const apiKey = cfg?.api_key || '';

        if (!apiKey) {
            throw new Error('IBData API key not configured');
        }

        const client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            timeout: 30000,
        });

        if (!configOverride) this.api = client;
        return client;
    }

    /**
     * Get wallet balance
     * Note: Documentation didn't specify balance endpoint, but usually exists.
     * If not, we might need to skip or find it.
     */
    async getWalletBalance(configOverride?: any) {
        try {
            const api = await this.ensureClient(configOverride);
            // Assuming there's a balance endpoint, if not this will fail gracefully
            const res = await api.get('/user/balance');
            return res.data;
        } catch (error: any) {
            logger.error('IBData getWalletBalance error:', error.response?.data || error.message);
            return { balance: 0 }; // Fallback
        }
    }

    /**
     * Get available networks
     * GET /billpayment/networks
     */
    async getNetworks(configOverride?: any) {
        try {
            const api = await this.ensureClient(configOverride);
            const res = await api.get('/billpayment/networks');
            logger.info('IBData networks retrieved', { count: res.data?.length || 0 });
            return res.data;
        } catch (error: any) {
            logger.error('IBData getNetworks error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get data plans
     * GET /billpayment/data-plans
     */
    async getDataPlans(network?: string, configOverride?: any) {
        try {
            const api = await this.ensureClient(configOverride);
            const params = network ? { network } : {};
            const res = await api.get('/billpayment/data-plans', { params });
            logger.info('IBData data plans retrieved', { count: res.data?.length || 0, network });
            return res.data;
        } catch (error: any) {
            logger.error('IBData getDataPlans error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Purchase airtime
     * POST /billpayment/airtime
     */
    async purchaseAirtime(data: any, configOverride?: any) {
        try {
            const api = await this.ensureClient(configOverride);

            const payload: IBDataPurchase = {
                phone: data.phone,
                network: this.normalizeNetwork(data.network),
                amount: Number(data.amount),
                airtime_type: data.airtime_type || 'VTU',
                ported_number: data.ported_number ?? true
            };

            const res = await api.post('/billpayment/airtime', payload);
            logger.info('IBData airtime purchased', {
                phone: payload.phone,
                amount: payload.amount,
                reference: res.data?.data?.transaction?.reference
            });
            return {
                status: 'success',
                ...res.data
            };
        } catch (error: any) {
            logger.error('IBData purchaseAirtime error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Purchase data plan
     * POST /billpayment/data
     */
    async purchaseData(data: any, configOverride?: any) {
        try {
            const api = await this.ensureClient(configOverride);

            const payload: IBDataPurchase = {
                phone: data.phone,
                network: this.normalizeNetwork(data.network),
                plan: data.plan, // Plan ID from /plans
                amount: Number(data.amount),
                ported_number: data.ported_number ?? true
            };

            const res = await api.post('/billpayment/data', payload);
            logger.info('IBData data purchased', {
                phone: payload.phone,
                plan: payload.plan,
                reference: res.data?.data?.transaction?.reference
            });
            return {
                status: 'success',
                ...res.data
            };
        } catch (error: any) {
            logger.error('IBData purchaseData error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get transaction status
     * GET /billpayment/transaction/:reference
     */
    async getTransactionStatus(reference: string) {
        try {
            const api = await this.ensureClient();
            const res = await api.get(`/billpayment/transaction/${encodeURIComponent(reference)}`);
            logger.info('IBData transaction status retrieved', { reference, status: res.data?.data?.status });
            return res.data;
        } catch (error: any) {
            logger.error('IBData getTransactionStatus error:', error.response?.data || error.message);
            throw error;
        }
    }

    private normalizeNetwork(network: string | number): string {
        const net = String(network).toLowerCase();
        if (net === '1' || net === 'mtn') return 'mtn';
        if (net === '2' || net === 'airtel') return 'airtel';
        if (net === '3' || net === 'glo') return 'glo';
        if (net === '4' || net === '9mobile') return '9mobile';
        return net;
    }
}

export default new IBDataService();
