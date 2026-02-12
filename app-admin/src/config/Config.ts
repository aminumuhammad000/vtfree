const ENV = {
    DEV_API: 'http://localhost:5000',
    PROD_API: 'https://api.vtfree.com.ng',
    IS_LOCAL: false, // Set to false to use the live API
};

export const Config = {
    BASE_URL: `${ENV.IS_LOCAL ? ENV.DEV_API : ENV.PROD_API}/api/v1/app-admin`,
    API_V1_URL: `${ENV.IS_LOCAL ? ENV.DEV_API : ENV.PROD_API}/api/v1`,
};
