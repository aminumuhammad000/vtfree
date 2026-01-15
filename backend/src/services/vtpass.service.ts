import axios, { AxiosInstance } from 'axios';
import ProviderConfig from '../models/provider.model.js';

class VTpassService {
  private api: AxiosInstance | null = null;
  private async ensureClient(configOverride?: any) {
    if (!configOverride && this.api) return this.api;
    const cfg = configOverride || await ProviderConfig.findOne({ code: 'vtpass' });
    const baseURL = cfg?.base_url || 'https://api-service.vtpass.com/api';
    const apiKey = cfg?.api_key || (cfg?.metadata as any)?.env?.VTPASS_API_KEY || '';
    const secret = cfg?.secret_key || (cfg?.metadata as any)?.env?.VTPASS_SECRET || '';
    const client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'secret-key': secret,
      },
      timeout: 30000,
    });
    if (!configOverride) this.api = client;
    return client;
  }

  async getNetworks(configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get('/service-categories?identifier=airtime');
    return res.data;
  }

  async getDataPlans(configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get('/service-categories?identifier=data');
    return res.data;
  }

  async getCableProviders(configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get('/service-categories?identifier=cabletv');
    return res.data;
  }

  async getElectricityProviders(configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get('/service-categories?identifier=electricity');
    return res.data;
  }

  async getExamPinProviders(configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get('/service-categories?identifier=education');
    return res.data;
  }

  async purchaseAirtime(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/pay', { serviceID: 'airtime', ...data });
    return res.data;
  }

  async purchaseData(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/pay', { serviceID: 'data', ...data });
    return res.data;
  }

  async verifyCableAccount(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/merchant-verify', data);
    return res.data;
  }

  async purchaseCableTV(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/pay', { serviceID: 'tv', ...data });
    return res.data;
  }

  async verifyElectricityMeter(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/merchant-verify', data);
    return res.data;
  }

  async purchaseElectricity(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/pay', { serviceID: 'electricity', ...data });
    return res.data;
  }

  async purchaseExamPin(data: any, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.post('/pay', { serviceID: 'education', ...data });
    return res.data;
  }

  async getTransactionStatus(reference: string, configOverride?: any) {
    const api = await this.ensureClient(configOverride);
    const res = await api.get(`/requery?request_id=${encodeURIComponent(reference)}`);
    return res.data;
  }
}

export default new VTpassService();
