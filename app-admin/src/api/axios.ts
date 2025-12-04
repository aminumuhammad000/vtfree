import axios from 'axios';

// const BASE_URL =
//   import.meta.env.MODE === 'production'
//     ? 'https://vtuapp-production.up.railway.app/api/admin'
//     : 'http://localhost:5000/api/admin';


// const BASE_URL = "http://localhost:5000/api/admin";
// const BASE_URL = "http://13.62.46.174/api/admin";
const BASE_URL = "https://api.ibdata.com.ng/api/admin";






console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.url}`, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// General API instance for non-admin endpoints
// const API_BASE = "http://13.62.46.174/api/";
const API_BASE = "https://api.ibdata.com.ng/api/";

export const generalApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

generalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

generalApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
