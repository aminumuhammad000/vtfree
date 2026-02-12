const ENV = {
    DEV_API: 'http://192.168.43.204:5000', // Change this to your local IP for physical device testing
    PROD_API: 'http://192.168.43.204:5000',
    IS_LOCAL: false, // Quick toggle if .env is missing or for explicit control
};

export const Config = {
    APP_ID: 'IBDataSub',
    API_URL: process.env.EXPO_PUBLIC_API_URL
        ? `${process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')}/api`
        : (ENV.IS_LOCAL ? `${ENV.DEV_API}/api` : `${ENV.PROD_API}/api`),
};
