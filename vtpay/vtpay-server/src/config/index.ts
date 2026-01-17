import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vtpay',

    // Zainpay
    zainpay: {
        baseUrl: process.env.ZAINPAY_BASE_URL || 'https://sandbox.zainpay.ng',
        publicKey: process.env.ZAINPAY_PUBLIC_KEY || '',
        secretKey: process.env.ZAINPAY_SECRET_KEY || '',
        zainboxCode: process.env.ZAINPAY_ZAINBOX_CODE || '',
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // Webhook
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'https://vtpayapi.vtfree.com.ng',

    // App
    app: {
        url: process.env.APP_URL || 'https://vtpay.vtfree.com.ng',
    },
};

export default config;
