import mongoose from 'mongoose';
import { Payout, Transaction, VirtualAccount } from '../models';
import config from '../config';

/**
 * Migration script to backfill fee data for existing payouts
 * Run with: npx ts-node src/scripts/migratePayouts.ts
 */
async function migrate() {
    console.log('🚀 Starting Payout Fee Migration...');

    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        const payouts = await Payout.find({
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
                const isInternal = await VirtualAccount.exists({ accountNumber: payout.accountNumber });

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
                const transaction = await Transaction.findOne({ reference: payout.reference });
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
            } catch (err: any) {
                console.error(`❌ Failed to migrate payout ${payout.reference}:`, err.message);
            }
        }

        console.log(`\n🎉 Migration finished. ${migratedCount} records updated.`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

migrate();
