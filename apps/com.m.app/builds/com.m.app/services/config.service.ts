import api from './api';

export const configService = {
    async getAppSettings() {
        try {
            const response = await api.get('/config/app');
            return response.data;
        } catch (error) {
            console.error('Error fetching app settings:', error);
            return { success: false, data: {} };
        }
    },

    async getReferralSettings() {
        try {
            const response = await api.get('/config/app');
            if (response.data.success) {
                const configs = response.data.data;
                const referralEnabled = configs.find((c: any) => c.key === 'REFERRAL_ENABLED')?.value === 'true';
                const referralAmount = Number(configs.find((c: any) => c.key === 'REFERRAL_AMOUNT')?.value || 0);

                return {
                    success: true,
                    enabled: referralEnabled,
                    amount: referralAmount
                };
            }
            return { success: false, enabled: false, amount: 0 };
        } catch (error) {
            console.error('Error fetching referral settings:', error);
            return { success: false, enabled: false, amount: 0 };
        }
    }
};
