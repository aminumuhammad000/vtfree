import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Feature Schema
const featureSchema = new mongoose.Schema({
    feature_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    icon_name: { type: String, required: true }, // Lucide icon name
    base_price: { type: Number, required: true, default: 0 },
    is_active: { type: Boolean, default: true },
    category: { type: String, enum: ['billpayment', 'finance', 'utility', 'communication'], default: 'utility' },
    display_order: { type: Number, default: 0 },
    requires_api: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Feature = mongoose.model('Feature', featureSchema);

// Comprehensive list of features based on app-template analysis
const features = [
    {
        feature_id: 'airtime',
        name: 'Airtime Top-up',
        slug: 'airtime',
        description: 'Buy airtime for any network (MTN, Glo, Airtel, 9Mobile)',
        icon_name: 'Smartphone',
        base_price: 3000,
        category: 'billpayment',
        display_order: 1,
        requires_api: true
    },
    {
        feature_id: 'data',
        name: 'Data Bundles',
        slug: 'data',
        description: 'Purchase data plans for all networks',
        icon_name: 'Wifi',
        base_price: 5000,
        category: 'billpayment',
        display_order: 2,
        requires_api: true
    },
    {
        feature_id: 'cable',
        name: 'Cable TV Subscription',
        slug: 'cable-tv',
        description: 'Pay for DSTV, GOTV, Startimes subscriptions',
        icon_name: 'Tv',
        base_price: 3000,
        category: 'billpayment',
        display_order: 3,
        requires_api: true
    },
    {
        feature_id: 'electricity',
        name: 'Electricity Bill',
        slug: 'electricity',
        description: 'Buy electricity units for all DISCOs',
        icon_name: 'Zap',
        base_price: 3000,
        category: 'utility',
        display_order: 4,
        requires_api: true
    },
    {
        feature_id: 'education',
        name: 'Education Pins',
        slug: 'education-pins',
        description: 'Purchase WAEC, NECO, JAMB result checker pins',
        icon_name: 'GraduationCap',
        base_price: 3000,
        category: 'utility',
        display_order: 5,
        requires_api: true
    },
    {
        feature_id: 'airtime2cash',
        name: 'Airtime to Cash',
        slug: 'airtime-to-cash',
        description: 'Convert airtime to cash instantly',
        icon_name: 'ArrowRightLeft',
        base_price: 5000,
        category: 'finance',
        display_order: 6,
        requires_api: true
    },
    {
        feature_id: 'bulksms',
        name: 'Bulk SMS',
        slug: 'bulk-sms',
        description: 'Send bulk SMS to multiple recipients',
        icon_name: 'MessageSquare',
        base_price: 3000,
        category: 'communication',
        display_order: 7,
        requires_api: true
    },
    {
        feature_id: 'giftcard',
        name: 'Gift Cards',
        slug: 'gift-cards',
        description: 'Buy and sell gift cards',
        icon_name: 'Gift',
        base_price: 5000,
        category: 'finance',
        display_order: 8,
        requires_api: true
    },
    {
        feature_id: 'internet',
        name: 'Internet Services',
        slug: 'internet-services',
        description: 'Pay for Smile, Spectranet, Ipnx internet bills',
        icon_name: 'Globe',
        base_price: 3000,
        category: 'utility',
        display_order: 9,
        requires_api: true
    },
    {
        feature_id: 'betting',
        name: 'Betting Wallet',
        slug: 'betting-wallet',
        description: 'Fund betting accounts (Bet9ja, SportyBet)',
        icon_name: 'DollarSign',
        base_price: 4000,
        category: 'finance',
        display_order: 10,
        requires_api: true
    }
];

async function seedFeatures() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing features (optional, comment out if you want to keep existing)
        // await Feature.deleteMany({});
        // console.log('🗑️  Cleared existing features');

        // Insert features (use insertMany with ordered: false to skip duplicates)
        const result = await Feature.insertMany(features, { ordered: false }).catch(err => {
            if (err.code === 11000) {
                console.log('⚠️  Some features already exist, skipping duplicates...');
                return { insertedCount: 0 };
            }
            throw err;
        });

        console.log(`✅ Seeded ${result.insertedCount || features.length} features successfully`);
        console.log('\nFeatures added:');
        features.forEach(f => console.log(`  - ${f.name} (${f.slug}) - ₦${f.base_price.toLocaleString()}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding features:', error);
        process.exit(1);
    }
}

// Run the seed function
seedFeatures();
