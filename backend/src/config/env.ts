// config/env.ts



interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  url: string;
}

interface ServiceCharges {
  airtime: number;
  data: number;
  cable: number;
  electricity: number;
  exampin: number;
}

export interface Config {
  port: number;
  nodeEnv: string;
  appUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiry: string;
  otpExpiry: number;
  corsOrigin: string;
  logLevel: string;
  cloudinary: CloudinaryConfig;
  serviceCharges: ServiceCharges;
  fundingAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions?: string;
  };
}

export const config: Config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5000',

  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/vtfree',

  // JWT Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',

  // OTP Configuration
  otpExpiry: parseInt(process.env.OTP_EXPIRY || '300000'), // 5 minutes

  // CORS & Logging
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',


  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || '',
  },

  // Service charges (percentage or flat amount - optional)
  serviceCharges: {
    airtime: parseFloat(process.env.AIRTIME_SERVICE_CHARGE || '0'),
    data: parseFloat(process.env.DATA_SERVICE_CHARGE || '0'),
    cable: parseFloat(process.env.CABLE_SERVICE_CHARGE || '0'),
    electricity: parseFloat(process.env.ELECTRICITY_SERVICE_CHARGE || '0'),
    exampin: parseFloat(process.env.EXAMPIN_SERVICE_CHARGE || '0'),
  },
  // Default funding account details
  fundingAccount: {
    bankName: process.env.FUNDING_BANK_NAME || 'Access Bank',
    accountName: process.env.FUNDING_ACCOUNT_NAME || 'VTStack Funding Account',
    accountNumber: process.env.FUNDING_ACCOUNT_NUMBER || '6600392859',
    instructions: process.env.FUNDING_INSTRUCTIONS || 'Transfer to this account and notify support with your reference.',
  }
};

export default config;