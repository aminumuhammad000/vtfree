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

    async updateApp(appId: string, data: any) {
        const response = await api.put(`/vtfree/apps/${appId}`, data);
        return response.data;
    },

    async addAppAdmin(appId: string, data: any) {
        const response = await api.post(`/vtfree/apps/${appId}/admins`, data);
        return response.data;
    },

    async upgradeApp(appId: string) {
        const response = await api.post(`/vtfree/apps/${appId}/upgrade`);
        return response.data;
    },

    async verifyAppPayment(reference: string, appPayload: any) {
        const response = await api.post('/vtfree/apps/verify-payment', { reference, appPayload });
        return response.data;
    },

    async getAppPrices() {
        const response = await api.get('/vtfree/apps/prices');
        return response.data;
    },

    async buildApp(appId: string) {
        const response = await api.post(`/vtfree/apps/${appId}/build`);
        return response.data;
    },

    async getBuildStatus(appId: string) {
        const response = await api.get(`/vtfree/apps/${appId}/status`);
        return response.data;
    },

    async payAndStartBuild(appId: string) {
        const response = await api.post(`/vtfree/apps/${appId}/pay-and-build`);
        return response.data;
    },

    async uploadLogo(fileUri: string) {
        const formData = new FormData();
        const filename = fileUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('logo', {
            uri: fileUri,
            name: filename,
            type
        } as any);

        const response = await api.post('/vtfree/apps/logo/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async checkPackageAvailability(packageName: string) {
        const response = await api.post('/vtfree/apps/check-package', { package_name: packageName });
        return response.data;
    },

    async deleteApp(appId: string) {
        const response = await api.delete(`/vtfree/apps/${appId}`);
        return response.data;
    }
};
