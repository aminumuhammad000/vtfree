import { connectDatabase } from '../config/database';
import Zainbox from '../models/Zainbox';
import User from '../models/User';

async function seedTestZainbox() {
    try {
        await connectDatabase();
        console.log('✅ Connected to database\n');

        // Find an active user to associate with the Zainbox
        const user = await User.findOne({ status: 'active' });
        if (!user) {
            console.error('❌ No active user found. Please create a user first.');
            process.exit(1);
        }

        console.log(`📝 Using user: ${user.email}\n`);

        // Create a test Zainbox
        const testZainbox = await Zainbox.create({
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
    } catch (error: any) {
        console.error('❌ Error seeding test Zainbox:', error.message);
        process.exit(1);
    }
}

seedTestZainbox();
