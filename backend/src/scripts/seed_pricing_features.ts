import mongoose from 'mongoose';
import Feature from '../models/Feature.js';
import { Plan } from '../models/plan.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vtfree';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Seed App Features (App Creation Services)
        const appFeatures = [
            {
                feature_id: 'bills',
                name: 'Bill Payments',
                slug: 'bill-payments',
                description: 'Enable Airtime, Data, and Utility bill payments',
                icon_name: 'CheckSquare',
                base_price: 5000,
                category: 'billpayment',
                requires_api: true
            },
            {
                feature_id: 'giftcard',
                name: 'Gift Cards',
                slug: 'gift-cards',
                description: 'Sell and redeem gift cards',
                icon_name: 'CreditCard',
                base_price: 15000,
                category: 'finance',
                requires_api: true
            },
            {
                feature_id: 'crypto',
                name: 'Crypto Exchange',
                slug: 'crypto-exchange',
                description: 'Allow users to buy/sell crypto',
                icon_name: 'Layers',
                base_price: 25000,
                category: 'finance',
                requires_api: true
            }
        ];

        for (const feat of appFeatures) {
            await Feature.findOneAndUpdate(
                { feature_id: feat.feature_id },
                feat,
                { upsert: true, new: true }
            );
            console.log(`Seeded Feature: ${feat.name}`);
        }

        // 2. Seed Pricing Plans
        const plans = [
            {
                name: 'Basic',
                price: 0,
                billing: 'monthly',
                features: ['Standard Support', 'Basic Analytics'],
                status: 'active'
            },
            {
                name: 'Professional',
                price: 15000,
                billing: 'monthly',
                features: ['Priority Support', 'Advanced Analytics', 'Custom Branding'],
                status: 'active'
            },
            {
                name: 'Enterprise',
                price: 50000,
                billing: 'monthly',
                features: ['Dedicated Account Manager', 'White-labeling', 'API Access'],
                status: 'active'
            }
        ];

        for (const plan of plans) {
            await Plan.findOneAndUpdate(
                { name: plan.name },
                plan,
                { upsert: true, new: true }
            );
            console.log(`Seeded Plan: ${plan.name}`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
