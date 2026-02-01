import mongoose from 'mongoose';
import { Feature } from '../models/feature.model.js';
import dotenv from 'dotenv';
dotenv.config();
const features = [
    {
        name: 'Data Services',
        description: 'Enable data purchase functionality in app',
        price: 0,
        category: 'Service',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:database-bold'
    },
    {
        name: 'Airtime Services',
        description: 'Enable airtime purchase functionality',
        price: 0,
        category: 'Service',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:phone-bold'
    },
    {
        name: 'Cable TV Payment',
        description: 'Enable cable TV subscription payments',
        price: 0,
        category: 'Service',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:tv-bold'
    },
    {
        name: 'Utility Bill Payment',
        description: 'Enable electricity and utility bill payments',
        price: 0,
        category: 'Service',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:lightbulb-bolt-bold'
    },
    {
        name: 'Publish to Web',
        description: 'Deploy your app as a web application',
        price: 5000,
        category: 'Publishing',
        billing_cycle: 'one-time',
        status: 'active',
        icon: 'solar:global-bold'
    },
    {
        name: 'Build Android App',
        description: 'Generate Android APK for your app',
        price: 10000,
        category: 'Publishing',
        billing_cycle: 'one-time',
        status: 'active',
        icon: 'solar:smartphone-2-bold'
    },
    {
        name: 'Build iOS App',
        description: 'Generate iOS IPA for your app',
        price: 15000,
        category: 'Publishing',
        billing_cycle: 'one-time',
        status: 'active',
        icon: 'solar:apple-bold'
    },
    {
        name: 'Publish to iOS Store',
        description: 'Submit and publish to Apple App Store',
        price: 25000,
        category: 'Publishing',
        billing_cycle: 'yearly',
        status: 'active',
        icon: 'solar:star-bold'
    },
    {
        name: 'Custom Branding',
        description: 'Full white-label branding customization',
        price: 3000,
        category: 'Add-on',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:palette-bold'
    },
    {
        name: 'Priority Support',
        description: '24/7 dedicated support channel',
        price: 5000,
        category: 'Add-on',
        billing_cycle: 'monthly',
        status: 'active',
        icon: 'solar:headphones-round-sound-bold'
    }
];
async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree');
        console.log('Connected to MongoDB');
        await Feature.deleteMany({});
        console.log('Cleared existing features');
        await Feature.insertMany(features);
        console.log('Inserted seed features');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}
seed();
