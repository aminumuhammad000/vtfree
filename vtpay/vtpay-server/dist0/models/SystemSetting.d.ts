import mongoose, { Document } from 'mongoose';
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
        payrant: {
            apiKey: string;
            baseUrl: string;
        };
    };
    parentAccount: {
        accountName: string;
        accountNumber: string;
        bankCode: string;
        type: 'PRIMARY' | 'SECONDARY';
        status: 'ACTIVE' | 'INACTIVE';
    };
    zainpaySettlement: {
        zainboxCode: string;
        scheduleType: 'T1' | 'T0';
        schedulePeriod: 'Daily' | 'Weekly' | 'Monthly';
        status: boolean;
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
    payout: {
        minAmount: number;
        vtpayFeePercent: number;
        zainpayPercentFee: number;
        bankSettlementFee: number;
        bankSettlementThreshold: number;
    };
    updatedAt: Date;
}
export declare const SystemSetting: mongoose.Model<ISystemSettingDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISystemSettingDocument, {}, {}> & ISystemSettingDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SystemSetting;
//# sourceMappingURL=SystemSetting.d.ts.map