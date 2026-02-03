"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Zainbox_1 = __importDefault(require("../models/Zainbox"));
const User_1 = __importDefault(require("../models/User"));
async function seedTestZainbox() {
    try {
        await (0, database_1.connectDatabase)();
        console.log('✅ Connected to database\n');
        // Find an active user to associate with the Zainbox
        const user = await User_1.default.findOne({ status: 'active' });
        if (!user) {
            console.error('❌ No active user found. Please create a user first.');
            process.exit(1);
        }
        console.log(`📝 Using user: ${user.email}\n`);
        // Create a test Zainbox
        const testZainbox = await Zainbox_1.default.create({
            userId: user._id,
            name: 'Test Zainbox',
            emailNotification: user.email,
            tags: 'test, demo',
            callbackUrl: 'https://example.com/webhook',
            codeName: 'TEST_ZAINBOX_001',
            zainboxCode: 'TEST_ZAINBOX_001',
            isActive: true,
            isLive: false,
            currentBalance: 50000, // ₦500.00 in kobo
        });
        console.log('✅ Test Zainbox created successfully!\n');
        console.log('Details:');
        console.log(`  - Name: ${testZainbox.name}`);
        console.log(`  - Code: ${testZainbox.zainboxCode}`);
        console.log(`  - Owner: ${user.email}`);
        console.log(`  - Balance: ₦${(testZainbox.currentBalance / 100).toFixed(2)}`);
        console.log(`  - Active: ${testZainbox.isActive}`);
        console.log(`  - Live: ${testZainbox.isLive}\n`);
        console.log('🎉 You can now test balance fetching in the admin panel!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding test Zainbox:', error.message);
        process.exit(1);
    }
}
seedTestZainbox();
//# sourceMappingURL=seed-test-zainbox.js.map