import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthService = {
    async register(data: any) {
        const response = await api.post('/vtfree/auth/register', data);
        if (response.data.success) {
            await AsyncStorage.setItem('vtfree_token', response.data.data.token);
            await AsyncStorage.setItem('vtfree_user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async login(data: any) {
        const response = await api.post('/vtfree/auth/login', data);
        if (response.data.success) {
            await AsyncStorage.setItem('vtfree_token', response.data.data.token);
            await AsyncStorage.setItem('vtfree_user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async logout() {
        await AsyncStorage.removeItem('vtfree_token');
        await AsyncStorage.removeItem('vtfree_user');
    },

    async getProfile() {
        const response = await api.get('/vtfree/auth/profile');
        return response.data;
    }
};
