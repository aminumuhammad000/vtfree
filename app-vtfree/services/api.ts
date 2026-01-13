import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use LAN IP for all devices to ensure connectivity (Physical & Emulator)
// IOS Simulator might prefer localhost, but LAN IP usually works too.
const BASE_URL = 'http://172.20.10.3:5000/api/v1';

// Alternative configuration if the above doesn't work for your specific setup:
/*
const BASE_URL = Platform.select({
    ios: 'http://localhost:5000/api/v1',
    android: 'http://10.0.2.2:5000/api/v1', // 10.0.2.2 for emulator only
    default: 'http://172.20.10.3:5000/api/v1',
});
*/

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
        if (error.response?.status === 401) {
            // Handle unauthorized access (e.g., logout)
            await AsyncStorage.removeItem('vtfree_token');
        }

        // Extract server error message if available
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        error.message = errorMessage; // Override the generic axios message

        return Promise.reject(error);
    }
);

export default api;
