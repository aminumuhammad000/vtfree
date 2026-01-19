"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const database_1 = require("../config/database");
const createAdmin = async () => {
    try {
        console.log('🚀 Starting admin creation script...');
        await (0, database_1.connectDatabase)();
        const email = process.argv[2] || 'admin@vtfree.com';
        const password = process.argv[3] || 'password123';
        // Check if user exists
        let user = await models_1.User.findOne({ email: email.toLowerCase() });
        if (user) {
            console.log(`ℹ️ User ${email} already exists. Updating password and role...`);
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(password, salt);
            user.status = 'active';
            user.role = 'admin';
            user.kycLevel = 3;
            user.kyc_status = 'verified';
            await user.save();
            console.log('✅ User updated successfully.');
        }
        else {
            console.log(`📝 Creating new admin user: ${email}...`);
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            user = new models_1.User({
                email: email.toLowerCase(),
                passwordHash,
                firstName: 'Admin',
                lastName: 'User',
                fullName: 'Admin User',
                phone: '08012345678',
                status: 'active',
                kycLevel: 3,
                kyc_status: 'verified',
                businessName: 'VTFree Admin',
                role: 'admin',
            });
            await user.save();
            console.log('✅ Admin user created successfully.');
        }
        // Ensure wallet exists
        let wallet = await models_1.Wallet.findOne({ userId: user._id });
        if (!wallet) {
            console.log('💰 Creating wallet for admin...');
            await models_1.Wallet.create({
                userId: user._id,
                balance: 0,
                currency: 'NGN',
            });
            console.log('✅ Wallet created successfully.');
        }
        else {
            console.log('ℹ️ Wallet already exists for this admin.');
        }
        console.log('\n🔐 Credentials:');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('\nYou can now login to the admin dashboard.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};
createAdmin();
//# sourceMappingURL=create-admin.js.map