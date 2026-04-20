import ProviderConfig from '../models/provider.model.js';
import smeplugService from './smeplug.service.js';
class ProviderRegistryService {
    clients = {
        smeplug: smeplugService,
        ibdata: smeplugService, // Register ibdata to use smeplugService
    };
    register(code, client) {
        this.clients[code] = client;
    }
    getClient(code) {
        return this.clients[code];
    }
    async getPreferredProviderFor(service, app_id, providerCode) {
        // If a specific providerCode is requested (e.g. from plan.source_provider), use it directly
        if (providerCode) {
            const client = this.getClient(providerCode);
            if (client)
                return { code: providerCode, client };
        }
        const filter = { active: true, supported_services: { $in: [service] } };
        if (app_id) {
            filter.app_id = app_id;
        }
        else {
            filter.app_id = { $exists: false }; // System global providers
        }
        const providers = await ProviderConfig.find(filter).sort({ priority: 1, name: 1 });
        // Iterate through providers and return the first one that has a registered client
        for (const p of providers) {
            const client = this.getClient(p.code);
            if (client)
                return { code: p.code, client };
        }
        return null;
    }
}
export const providerRegistry = new ProviderRegistryService();
export default providerRegistry;
