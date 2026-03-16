
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ProviderConfig } from './models/provider.model.js';

dotenv.config();

const configureProviders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connecta_vtu');
        console.log('Connected to MongoDB');

        // 1. Configure SME Plug (Active, Priority 1)
        await ProviderConfig.findOneAndUpdate(
            { code: 'smeplug' },
            {
                active: true,
                priority: 1,
                supported_services: ['airtime', 'data']
            },
            { upsert: true, new: true }
        );
        console.log('✅ SME Plug configured: Active, Priority 1');

        // 2. Configure VTStack (Active, Priority 1 for Virtual Accounts/Payments)
        await ProviderConfig.findOneAndUpdate(
            { code: 'vtstack' },
            {
                name: 'VTStack',
                active: true,
                priority: 1,
                supported_services: ['payment', 'virtual_account']
            },
            { upsert: true, new: true }
        );
        console.log('✅ VTStack configured: Active, Priority 1');

        // 3. Deactivate all others
        await ProviderConfig.updateMany(
            { code: { $nin: ['smeplug', 'vtstack'] } },
            { active: false }
        );
        console.log('✅ Legacy providers deactivated');

        console.log('\n--- Final Provider State ---');
        const providers = await ProviderConfig.find({}).sort({ priority: 1 });
        providers.forEach(p => {
            console.log(`[${p.active ? 'ACTIVE' : 'INACTIVE'}] ${p.name} (${p.code}) - Priority: ${p.priority}`);
            console.log(`  Services: ${p.supported_services.join(', ')}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

configureProviders();
