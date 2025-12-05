import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const BASE_URL = Platform.select({
    ios: 'http://localhost:5000/api/v1',
    android: 'http://10.0.2.2:5000/api/v1',
    default: 'http://localhost:5000/api/v1',
});

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
        return Promise.reject(error);
    }
);

export default api;
