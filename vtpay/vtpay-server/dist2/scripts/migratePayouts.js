"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const config_1 = __importDefault(require("../config"));
/**
 * Migration script to backfill fee data for existing payouts
 * Run with: npx ts-node src/scripts/migratePayouts.ts
 */
async function migrate() {
    console.log('🚀 Starting Payout Fee Migration...');
    try {
        await mongoose_1.default.connect(config_1.default.mongodbUri);
        console.log('✅ Connected to MongoDB');
        const payouts = await models_1.Payout.find({
            $or: [
                { vtpayFee: { $exists: false } },
                { payoutType: { $exists: false } },
                { netAmount: { $exists: false } }
            ]
        });
        console.log(`Found ${payouts.length} payouts to migrate.`);
        let migratedCount = 0;
        for (const payout of payouts) {
            try {
                // 1. Determine if Internal or External
                const isInternal = await models_1.VirtualAccount.exists({ accountNumber: payout.accountNumber });
                // 2. Calculate Fees (0.6% VTpay, 1.6% + 25 Zainpay if external)
                const vtpayFee = Math.ceil(payout.amount * 0.006);
                let zainpayPercentFee = 0;
                let zainpayFixedFee = 0;
                if (!isInternal) {
                    zainpayPercentFee = Math.ceil(payout.amount * 0.016);
                    zainpayFixedFee = 2500; // NGN 25 in kobo
                }
                const netAmount = payout.amount - vtpayFee - zainpayPercentFee - zainpayFixedFee;
                // 3. Update Payout Record
                payout.vtpayFee = vtpayFee;
                payout.zainpayPercentFee = zainpayPercentFee;
                payout.zainpayFixedFee = zainpayFixedFee;
                payout.netAmount = netAmount;
                payout.payoutType = isInternal ? 'internal' : 'external';
                // If totalDeducted was missing or wrong
                payout.totalDeducted = payout.amount;
                await payout.save();
                // 4. Update associated Ledger Transaction
                const transaction = await models_1.Transaction.findOne({ reference: payout.reference });
                if (transaction) {
                    transaction.fee = vtpayFee + zainpayPercentFee + zainpayFixedFee;
                    transaction.metadata = {
                        ...(transaction.metadata || {}),
                        payoutId: payout._id,
                        vtpayFee,
                        zainpayPercentFee,
                        zainpayFixedFee,
                        netAmount,
                        payoutType: payout.payoutType
                    };
                    await transaction.save();
                }
                migratedCount++;
                console.log(`[${migratedCount}/${payouts.length}] Migrated: ${payout.reference} (${payout.payoutType})`);
            }
            catch (err) {
                console.error(`❌ Failed to migrate payout ${payout.reference}:`, err.message);
            }
        }
        console.log(`\n🎉 Migration finished. ${migratedCount} records updated.`);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}
migrate();
//# sourceMappingURL=migratePayouts.js.map