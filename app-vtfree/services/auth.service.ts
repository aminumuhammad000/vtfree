import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const AuthService = {
    async register(data: any, saveCredentials = true) {
        const response = await api.post('/vtfree/auth/register', data);
        if (response.data.success) {
            await AsyncStorage.setItem('vtfree_token', response.data.data.token);
            await AsyncStorage.setItem('vtfree_user', JSON.stringify(response.data.data.user));
            // Store credentials for biometric login if requested
            if (saveCredentials) {
                await SecureStore.setItemAsync('vtfree_last_email', data.email);
                await SecureStore.setItemAsync('vtfree_last_password', data.password);
            }
        }
        return response.data;
    },

    async login(data: any, saveCredentials = true) {
        // Clear any old session data first
        await AsyncStorage.multiRemove(['vtfree_token', 'vtfree_user']);

        const response = await api.post('/vtfree/auth/login', data);
        if (response.data.success) {
            await AsyncStorage.setItem('vtfree_token', response.data.data.token);
            await AsyncStorage.setItem('vtfree_user', JSON.stringify(response.data.data.user));

            // Store credentials for biometric login if requested
            if (saveCredentials) {
                await SecureStore.setItemAsync('vtfree_last_email', data.email);
                await SecureStore.setItemAsync('vtfree_last_password', data.password);
            }
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
    },

    async updateProfile(data: any) {
        const response = await api.put('/vtfree/auth/profile', data);
        if (response.data.success) {
            await AsyncStorage.setItem('vtfree_user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async forgotPassword(email: string) {
        const response = await api.post('/vtfree/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(data: any) {
        const response = await api.post('/vtfree/auth/reset-password', data);
        return response.data;
    },

    async uploadProfilePicture(formData: FormData) {
        const token = await AsyncStorage.getItem('vtfree_token');
        const response = await fetch(`${api.defaults.baseURL}/vtfree/auth/profile/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                // Content-Type is intentionally excluded to let the browser/native engine set boundary
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Image upload failed');
        }

        return data;
    },

    async createVirtualAccount(bankType: string, bvn?: string) {
        const response = await api.post('/vtfree/auth/create-virtual-account', { bankType, bvn });
        return response.data;
    }
};
