import axios from 'axios';
import ProviderConfig from '../models/provider.model.js';
import logger from '../utils/logger.js';
class IBDataService {
    api = null;
    async ensureClient(configOverride) {
        if (!configOverride && this.api)
            return this.api;
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
        if (!configOverride)
            this.api = client;
        return client;
    }
    /**
     * Get wallet balance
     * GET /billpayment/balance
     */
    async getWalletBalance(configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const res = await api.get('/billpayment/balance');
            const data = res.data;
            if (data.success && data.data) {
                return {
                    balance: Number(data.data.balance),
                    currency: data.data.currency || 'NGN',
                    raw: data
                };
            }
            return data;
        }
        catch (error) {
            logger.error('IBData getWalletBalance error:', error.response?.data || error.message);
            return { balance: 0, error: error.message };
        }
    }
    /**
     * Get available networks
     * GET /billpayment/networks
     */
    async getNetworks(configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const res = await api.get('/billpayment/networks');
            const data = res.data;
            logger.info('IBData networks retrieved', { count: (data.data || data)?.length || 0 });
            return data.success ? data.data : data;
        }
        catch (error) {
            logger.error('IBData getNetworks error:', error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get data plans
     * GET /billpayment/data-plans
     */
    async getDataPlans(network, configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const params = network ? { network } : {};
            const res = await api.get('/billpayment/data-plans', { params });
            const data = res.data;
            logger.info('IBData data plans retrieved', { count: (data.data || data)?.length || 0, network });
            return data.success ? data.data : data;
        }
        catch (error) {
            logger.error('IBData getDataPlans error:', error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get cable tv plans
     * GET /billpayment/cable-plans
     */
    async getCablePlans(configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const res = await api.get('/billpayment/cable-plans');
            const data = res.data;
            logger.info('IBData cable plans retrieved', { count: (data.data || data)?.length || 0 });
            return data.success ? data.data : data;
        }
        catch (error) {
            logger.error('IBData getCablePlans error:', error.response?.data || error.message);
            // Fallback to empty array if endpoint doesn't exist yet
            return [];
        }
    }
    /**
     * Get utility plans
     * GET /billpayment/utility-plans
     */
    async getUtilityPlans(configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const res = await api.get('/billpayment/utility-plans');
            const data = res.data;
            logger.info('IBData utility plans retrieved', { count: (data.data || data)?.length || 0 });
            return data.success ? data.data : data;
        }
        catch (error) {
            logger.error('IBData getUtilityPlans error:', error.response?.data || error.message);
            // Fallback to empty array if endpoint doesn't exist yet
            return [];
        }
    }
    /**
     * Purchase airtime
     * POST /billpayment/airtime
     */
    async purchaseAirtime(data, configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const payload = {
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
        }
        catch (error) {
            logger.error('IBData purchaseAirtime error:', error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Purchase data plan
     * POST /billpayment/data
     */
    async purchaseData(data, configOverride) {
        try {
            const api = await this.ensureClient(configOverride);
            const payload = {
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
        }
        catch (error) {
            logger.error('IBData purchaseData error:', error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get transaction status
     * GET /billpayment/transaction/:reference
     */
    async getTransactionStatus(reference) {
        try {
            const api = await this.ensureClient();
            const res = await api.get(`/billpayment/transaction/${encodeURIComponent(reference)}`);
            logger.info('IBData transaction status retrieved', { reference, status: res.data?.data?.status });
            return res.data;
        }
        catch (error) {
            logger.error('IBData getTransactionStatus error:', error.response?.data || error.message);
            throw error;
        }
    }
    normalizeNetwork(network) {
        const net = String(network).toLowerCase();
        if (net === '1' || net === 'mtn')
            return 'mtn';
        if (net === '2' || net === 'airtel')
            return 'airtel';
        if (net === '3' || net === 'glo')
            return 'glo';
        if (net === '4' || net === '9mobile')
            return '9mobile';
        return net;
    }
}
export default new IBDataService();
