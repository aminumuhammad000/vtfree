import api from './api';

export const SupportService = {
    async createTicket(data: { subject: string; description: string; priority: string }) {
        const response = await api.post('/support', data);
        return response.data;
    },

    async getTickets() {
        const response = await api.get('/support');
        return response.data;
    },

    async getDocumentation() {
        const response = await api.get('/support-content');
        return response.data;
    }
};
