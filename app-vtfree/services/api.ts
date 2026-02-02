import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// DEVELOPMENT: Use local backend
// Change this IP to match your computer's local IP address
// Run "hostname -I" or "ipconfig" to find your local IP
export const BASE_URL = 'http://api.vtfree.com.ng/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('vtfree_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message || '';

        if (status === 401) {
            // Handle unauthorized access
            await AsyncStorage.removeItem('vtfree_token');

            // If it's "No token provided", it's expected (user not logged in yet)
            // Don't show a RedBox for this - just log it quietly
            if (serverMessage.includes('No token provided')) {
                console.log('ℹ️  API call requires authentication');

                // Return a clean rejection without the error stack to avoid RedBox
                return Promise.reject({
                    response: error.response,
                    message: 'No token provided',
                    isAuthError: true,
                });
            } else {
                console.warn('Session expired or invalid token');
            }
        }

        // Extract server error message if available
        const errorMessage = serverMessage || error.message || 'An unknown error occurred';
        error.message = errorMessage;

        return Promise.reject(error);
    }
);

export default api;
