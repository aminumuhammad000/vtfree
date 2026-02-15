import ProviderConfig from '../models/provider.model.js';
import topupmateService from './topupmate.service.js';
import vtpassService from './vtpass.service.js';
import smeplugService from './smeplug.service.js';
import ibdataService from './ibdata.service.js';

interface ProviderClient {
  getNetworks?: () => Promise<any>;
  getDataPlans?: () => Promise<any>;
  getCableProviders?: () => Promise<any>;
  getCableTVPlans?: () => Promise<any>;
  getElectricityProviders?: () => Promise<any>;
  getExamPinProviders?: () => Promise<any>;
  purchaseAirtime?: (data: any) => Promise<any>;
  purchaseData?: (data: any) => Promise<any>;
  verifyCableAccount?: (data: any) => Promise<any>;
  purchaseCableTV?: (data: any) => Promise<any>;
  verifyElectricityMeter?: (data: any) => Promise<any>;
  purchaseElectricity?: (data: any) => Promise<any>;
  purchaseExamPin?: (data: any) => Promise<any>;
  getTransactionStatus?: (reference: string) => Promise<any>;
  getWalletBalance?: () => Promise<any>;
}

class ProviderRegistryService {
  private clients: Record<string, ProviderClient> = {
    topupmate: topupmateService,
    vtpass: vtpassService,
    smeplug: smeplugService,
    ibdata: ibdataService,
  };

  register(code: string, client: ProviderClient) {
    this.clients[code] = client;
  }

  getClient(code: string): ProviderClient | undefined {
    return this.clients[code];
  }

  async getPreferredProviderFor(service: string, app_id?: string, providerCode?: string): Promise<{ code: string; client: ProviderClient } | null> {
    // If a specific providerCode is requested (e.g. from plan.source_provider), use it directly
    if (providerCode) {
      const client = this.getClient(providerCode);
      if (client) return { code: providerCode, client };
    }

    const filter: any = { active: true, supported_services: { $in: [service] } };
    if (app_id) {
      filter.app_id = app_id;
    } else {
      filter.app_id = { $exists: false }; // System global providers
    }

    const providers = await ProviderConfig.find(filter).sort({ priority: 1, name: 1 });

    // Check for IBData first regardless of other providers
    const ibdataProvider = providers.find(p => p.code === 'ibdata');
    if (ibdataProvider) {
      const ibdataClient = this.getClient('ibdata');
      if (ibdataClient) {
        return { code: 'ibdata', client: ibdataClient };
      }
    }

    // Then check other providers
    for (const p of providers) {
      if (p.code !== 'ibdata') {
        const client = this.getClient(p.code);
        if (client) return { code: p.code, client };
      }
    }

    // Final fallback to IBData if no provider found for this app
    if (app_id) {
      // Check if there is a global IBData fallback or if we should just use the client
      const fallback = this.getClient('ibdata');
      return fallback ? { code: 'ibdata', client: fallback } : null;
    }

    const fallback = this.getClient('ibdata');
    return fallback ? { code: 'ibdata', client: fallback } : null;
  }
}

export const providerRegistry = new ProviderRegistryService();
export default providerRegistry;
