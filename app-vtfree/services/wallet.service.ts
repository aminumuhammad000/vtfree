import api from './api';

export const WalletService = {
    async getWallet() {
        const response = await api.get('/vtfree/wallet');
        return response.data;
    },

    async fundWallet(amount: number) {
        const response = await api.post('/vtfree/wallet/fund', { amount });
        return response.data;
    }
};
