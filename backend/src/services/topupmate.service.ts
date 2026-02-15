// services/topupmate.service.ts
import axios, { AxiosInstance } from 'axios';
import { config, logger } from '../config/bootstrap.js';
import ProviderConfig from '../models/provider.model.js';

interface TopupmateResponse {
  status: string;
  msg?: string;
  response?: any;
  [key: string]: any;
}

class TopupmateService {
  private api: AxiosInstance | null = null;
  private baseURL: string = 'https://connect.topupmate.com/api';

  private async ensureClient(configOverride?: any) {
    if (!configOverride && this.api) return this.api;

    const cfg = configOverride || await ProviderConfig.findOne({ code: 'topupmate' });
    const baseURL = cfg?.base_url || this.baseURL;
    const apiKey = cfg?.api_key || (cfg?.metadata as any)?.env?.TOPUPMATE_API_KEY || config.topupmate.apiKey || '';

    const client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      timeout: 30000,
    });

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        logger.info(`TopupMate API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('TopupMate API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        logger.info(`TopupMate API Response: ${response.status}`, response.data);
        return response;
      },
      (error) => {
        logger.error('TopupMate API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    if (!configOverride) this.api = client;
    return client;
  }

  // Get service data (networks, plans, etc.)
  async getServiceData(service: string, configOverride?: any): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient(configOverride);
      const response = await api.get(`/services/`, {
        params: { service },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching ${service} data:`, error.message);
      throw new Error(`Failed to fetch ${service} data: ${error.message}`);
    }
  }

  // Get networks
  async getNetworks(configOverride?: any) {
    return this.getServiceData('network', configOverride);
  }

  // Get airtime pricing
  async getAirtimePricing(configOverride?: any) {
    return this.getServiceData('airtime', configOverride);
  }

  // Get data plans
  async getDataPlans(configOverride?: any) {
    return this.getServiceData('data', configOverride);
  }

  // Get data categories
  async getDataCategories(configOverride?: any) {
    return this.getServiceData('data-category', configOverride);
  }

  // Get cable providers
  async getCableProviders(configOverride?: any) {
    return this.getServiceData('cable-provider', configOverride);
  }

  // Get cable TV plans
  async getCableTVPlans(configOverride?: any) {
    return this.getServiceData('cabletv', configOverride);
  }

  // Get electricity providers
  async getElectricityProviders(configOverride?: any) {
    return this.getServiceData('electricity', configOverride);
  }

  // Get exam pin providers
  async getExamPinProviders(configOverride?: any) {
    return this.getServiceData('exampin', configOverride);
  }

  // Get data pin plans
  async getDataPinPlans(configOverride?: any) {
    return this.getServiceData('datapin', configOverride);
  }

  // Get recharge card plans
  async getRechargeCardPlans(configOverride?: any) {
    return this.getServiceData('recharge-card', configOverride);
  }

  // Verify account balance (for checking if service is available)
  async checkServiceStatus(service: string, configOverride?: any): Promise<boolean> {
    try {
      const result = await this.getServiceData(service, configOverride);
      return result.status === 'success';
    } catch (error) {
      return false;
    }
  }

  // Purchase airtime
  async purchaseAirtime(data: {
    network: string;
    phone: string;
    ref: string;
    airtime_type: string;
    ported_number: boolean;
    amount: string;
  }, configOverride?: any): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient(configOverride);
      const response = await api.post('/airtime/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing airtime:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Airtime purchase failed: ${msg}`);
    }
  }

  // Purchase data
  async purchaseData(data: {
    network: string;
    phone: string;
    ref: string;
    plan: string;
    ported_number: boolean;
  }, configOverride?: any): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient(configOverride);
      const response = await api.post('/data/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing data:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Data purchase failed: ${msg}`);
    }
  }

  // Verify cable TV account
  async verifyCableAccount(data: {
    provider: string;
    iucnumber: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/cable/verify/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error verifying cable account:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Cable verification failed: ${msg}`);
    }
  }

  // Purchase cable TV subscription
  async purchaseCableTV(data: {
    provider: string;
    iucnumber: string;
    plan: string;
    ref: string;
    subtype: 'renew' | 'change';
    phone: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/cabletv/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing cable TV:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Cable TV purchase failed: ${msg}`);
    }
  }

  // Verify electricity meter
  async verifyElectricityMeter(data: {
    provider: string;
    meternumber: string;
    metertype: 'prepaid' | 'postpaid';
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/electricity/verify/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error verifying electricity meter:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Meter verification failed: ${msg}`);
    }
  }

  // Purchase electricity
  async purchaseElectricity(data: {
    provider: string;
    meternumber: string;
    amount: string;
    metertype: 'prepaid' | 'postpaid';
    phone: string;
    ref: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/electricity/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing electricity:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Electricity purchase failed: ${msg}`);
    }
  }

  // Purchase exam pin
  async purchaseExamPin(data: {
    provider: string;
    quantity: string;
    ref: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/exampin/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing exam pin:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Exam pin purchase failed: ${msg}`);
    }
  }

  // Purchase recharge pin
  async purchaseRechargePin(data: {
    network: string;
    quantity: string;
    plan: string;
    businessname: string;
    ref: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/rechargepin/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing recharge pin:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Recharge pin purchase failed: ${msg}`);
    }
  }

  // Purchase data pin
  async purchaseDataPin(data: {
    network: string;
    quantity: string;
    data_plan: string;
    businessname: string;
    ref: string;
  }): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.post('/datapin/', data);
      return response.data;
    } catch (error: any) {
      logger.error('Error purchasing data pin:', error.message, error.response?.data);
      const msg = error.response?.data?.msg || error.message;
      throw new Error(`Data pin purchase failed: ${msg}`);
    }
  }

  // Get transaction status
  async getTransactionStatus(reference: string): Promise<TopupmateResponse> {
    try {
      const api = await this.ensureClient();
      const response = await api.get('/transaction/status/', {
        params: { reference },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching transaction status:', error.message);
      throw new Error(`Failed to fetch transaction status: ${error.message}`);
    }
  }

  // Get wallet balance (account info)
  async getWalletBalance(configOverride?: any): Promise<{ balance: number; currency?: string; name?: string; status?: string; raw?: any }> {
    try {
      const api = await this.ensureClient(configOverride);
      const response = await api.get('/user/');
      const data = response.data as any;
      const rawBalance = data?.balance ?? data?.response?.balance;
      const numeric = typeof rawBalance === 'number'
        ? rawBalance
        : parseFloat(String(rawBalance ?? '0').replace(/,/g, ''));
      return {
        balance: isNaN(numeric) ? 0 : numeric,
        currency: 'NGN',
        name: data?.name,
        status: data?.status,
        raw: data,
      };
    } catch (error: any) {
      logger.error('TopupMate getWalletBalance error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch TopupMate balance: ${error.message}`);
    }
  }

  // Generate unique reference
  generateReference(prefix: string): string {
    return `${prefix}_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new TopupmateService();