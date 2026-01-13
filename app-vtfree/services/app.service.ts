import api from './api';

export const AppService = {
    async createApp(data: any) {
        const response = await api.post('/vtfree/apps/create', data);
        return response.data;
    },

    async getMyApps() {
        const response = await api.get('/vtfree/apps/my-apps');
        return response.data;
    },

    async getAppDetails(appId: string) {
        const response = await api.get(`/vtfree/apps/${appId}`);
        return response.data;
    },

    async verifyAppPayment(reference: string, appPayload: any) {
        const response = await api.post('/vtfree/apps/verify-payment', { reference, appPayload });
        return response.data;
    }
};
