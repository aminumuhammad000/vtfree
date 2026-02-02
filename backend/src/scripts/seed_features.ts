import mongoose from 'mongoose';
import Feature from '../models/Feature.js';
import dotenv from 'dotenv';

dotenv.config();

const features = [
    {
        feature_id: 'airtime',
        name: 'Airtime Topup',
        slug: 'airtime-topup',
        description: 'Instant airtime recharge for all networks',
        icon_name: 'Smartphone',
        base_price: 1000,
        is_active: true,
        category: 'communication',
        display_order: 1,
        requires_api: true
    },
    {
        feature_id: 'data',
        name: 'Data Bundle',
        slug: 'data-bundle',
        description: 'Cheap data bundles for all networks',
        icon_name: 'Globe',
        base_price: 1500,
        is_active: true,
        category: 'communication',
        display_order: 2,
        requires_api: true
    },
    {
        feature_id: 'cable',
        name: 'Cable TV',
        slug: 'cable-tv',
        description: 'Pay for DSTV, GOTV, and StarTimes',
        icon_name: 'Monitor',
        base_price: 2000,
        is_active: true,
        category: 'utility',
        display_order: 3,
        requires_api: true
    },
    {
        feature_id: 'electricity',
        name: 'Electricity',
        slug: 'electricity-bill',
        description: 'Pay for prepaid and postpaid electricity',
        icon_name: 'Zap',
        base_price: 2000,
        is_active: true,
        category: 'utility',
        display_order: 4,
        requires_api: true
    },
    {
        feature_id: 'wallet',
        name: 'Wallet System',
        slug: 'wallet-system',
        description: 'Internal wallet for users to store funds',
        icon_name: 'Wallet',
        base_price: 5000,
        is_active: true,
        category: 'finance',
        display_order: 5,
        requires_api: false
    }
];

async function seed() {
    try {
        const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree';
        console.log('Connecting to:', mongoUrl);
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        await Feature.deleteMany({});
        console.log('Cleared existing features');

        await Feature.insertMany(features);
        console.log('Inserted seed features');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
