"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SystemSetting_1 = require("../models/SystemSetting");
const config_1 = __importDefault(require("../config"));
async function checkSettings() {
    try {
        await mongoose_1.default.connect(config_1.default.mongodbUri);
        const settings = await SystemSetting_1.SystemSetting.findOne();
        console.log('System Settings:', JSON.stringify(settings, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
checkSettings();
//# sourceMappingURL=check-settings.js.map