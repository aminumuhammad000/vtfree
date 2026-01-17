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
        await (0, database_1.connectDatabase)();
        const email = 'admin@vtfree.com';
        const password = 'password123';
        // Check if user exists
        let user = await models_1.User.findOne({ email });
        if (user) {
            console.log('User already exists. Updating password...');
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(password, salt);
            user.status = 'active';
            user.role = 'admin';
            await user.save();
            console.log('Password updated successfully.');
        }
        else {
            console.log('Creating new admin user...');
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            user = new models_1.User({
                email,
                passwordHash,
                firstName: 'Admin',
                lastName: 'User',
                fullName: 'Admin User',
                phone: '08012345678',
                status: 'active',
                kycLevel: 3,
                businessName: 'VTFree Admin',
                role: 'admin',
            });
            await user.save();
            console.log('Admin user created successfully.');
        }
        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};
createAdmin();
//# sourceMappingURL=create-admin.js.map