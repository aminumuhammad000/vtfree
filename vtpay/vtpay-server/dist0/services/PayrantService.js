"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrantService = exports.PayrantService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class PayrantService {
    constructor() {
        this.baseUrl = 'https://api-core.payrant.com/';
        this.apiKey = '';
        this.initializeClient();
    }
    initializeClient() {
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
        this.client.interceptors.response.use((response) => response, (error) => {
            logger_1.logger.error('Payrant API Error', {
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        });
    }
    async refreshConfig() {
        try {
            const { SystemSetting } = await Promise.resolve().then(() => __importStar(require('../models/SystemSetting')));
            const settings = await SystemSetting.findOne();
            if (settings && settings.integrations?.payrant) {
                const pr = settings.integrations.payrant;
                this.baseUrl = pr.baseUrl || 'https://api-core.payrant.com/';
                this.apiKey = pr.apiKey || '';
                this.initializeClient();
                logger_1.logger.info('Payrant config refreshed from database');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh Payrant config', error);
        }
    }
    async transfer(payload) {
        await this.refreshConfig();
        const response = await this.client.post('/payout/transfer', payload);
        return response.data;
    }
    // Add verification if Payrant provides an endpoint for it
    async verifyTransfer(transferId) {
        await this.refreshConfig();
        const response = await this.client.get(`/payout/transfer/${transferId}`);
        return response.data;
    }
}
exports.PayrantService = PayrantService;
exports.payrantService = new PayrantService();
exports.default = exports.payrantService;
//# sourceMappingURL=PayrantService.js.map