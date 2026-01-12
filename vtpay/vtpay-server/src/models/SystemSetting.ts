import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettingDocument extends Document {
    general: {
        companyName: string;
        supportEmail: string;
        timezone: string;
        currency: string;
        maintenanceMode: boolean;
    };
    notifications: {
        emailAlerts: boolean;
        slackIntegration: boolean;
        webhookRetries: number;
        dailyReports: boolean;
    };
    security: {
        twoFactorAuth: boolean;
        sessionTimeout: number;
        passwordExpiry: number;
        ipWhitelist: string;
    };
    integrations: {
        zainpay: {
            apiKey: string;
            secretKey: string;
            baseUrl: string;
            isLive: boolean;
        };
    };
    emailConfig: {
        provider: 'gmail' | 'other';
        gmail: {
            user: string;
            pass: string;
        };
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            pass: string;
        };
    };
    updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSettingDocument>(
    {
        general: {
            companyName: { type: String, default: 'VTPay Systems' },
            supportEmail: { type: String, default: 'support@vtpay.com' },
            timezone: { type: String, default: 'Africa/Lagos' },
            currency: { type: String, default: 'NGN' },
            maintenanceMode: { type: Boolean, default: false },
        },
        notifications: {
            emailAlerts: { type: Boolean, default: true },
            slackIntegration: { type: Boolean, default: false },
            webhookRetries: { type: Number, default: 3 },
            dailyReports: { type: Boolean, default: true },
        },
        security: {
            twoFactorAuth: { type: Boolean, default: false },
            sessionTimeout: { type: Number, default: 30 },
            passwordExpiry: { type: Number, default: 90 },
            ipWhitelist: { type: String, default: '' },
        },
        integrations: {
            zainpay: {
                apiKey: { type: String, default: '' },
                secretKey: { type: String, default: '' },
                baseUrl: { type: String, default: 'https://api.zainpay.ng' },
                isLive: { type: Boolean, default: false },
            },
        },
        emailConfig: {
            provider: { type: String, enum: ['gmail', 'other'], default: 'gmail' },
            gmail: {
                user: { type: String, default: '' },
                pass: { type: String, default: '' },
            },
            smtp: {
                host: { type: String, default: '' },
                port: { type: Number, default: 587 },
                secure: { type: Boolean, default: false },
                user: { type: String, default: '' },
                pass: { type: String, default: '' },
            },
        },
    },
    {
        timestamps: true,
    }
);

export const SystemSetting = mongoose.model<ISystemSettingDocument>('SystemSetting', SystemSettingSchema);
export default SystemSetting;
