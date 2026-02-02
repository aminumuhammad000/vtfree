import { Request, Response } from 'express';
import VTfreeUser from '../models/vtfree_user.model.js'; // Ensure .js extension for imports in this project structure
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { logger } from '../config/bootstrap.js'; // Assuming logger is exported from bootstrap or utils

export const handleVTPayWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log('Received VTPay Webhook:', JSON.stringify(payload, null, 2));

        // 1. Basic Validation (Check for event type if applicable, or just essential fields)
        // Adjust based on actual VTPay webhook structure. 
        // Assuming structure: { event: 'transaction.success', data: { reference, amount, accountNumber, ... } }
        // OR direct object: { status: 'success', reference: '...', amount: 100, accountNumber: '...' }

        let data = payload;
        if (payload.data) {
            data = payload.data;
        }

        // Check if it's a successful credit transaction
        if (data.status !== 'successful' && data.status !== 'success' && payload.event !== 'transaction.successful') {
            // Just acknowledge ignored events
            return res.status(200).json({ success: true, message: 'Event ignored' });
        }

        const { reference, accountNumber } = data;
        // Normalize amount: check amountNaira first, else check if amount is in kobo
        let creditAmount = Number(data.amountNaira);
        if (!creditAmount && data.amount) {
            // If amountNaira isn't provided, we assume data.amount is in Kobo (standard for Paystack/Monnify similar systems)
            // But let's be careful. If VTPay sends Naira in 'amount', we might under-credit.
            // Based on super_admin.controller: tx.amountNaira || (tx.amount / 100)
            creditAmount = Number(data.amount) / 100;
        }

        if (!reference || !creditAmount || creditAmount <= 0) {
            console.warn('Webhook payload missing reference or valid amount', { reference, amount: data.amount });
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        // 2. Check duplicate transaction
        const existingTx = await VTfreeTransaction.findOne({ reference });
        if (existingTx) {
            console.log(`Transaction ${reference} already processed.`);
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        // 3. Find User
        // Need to find user by virtual account number. 
        // Since virtual_account structure is nested, we query:
        const user = await VTfreeUser.findOne({ 'virtual_account.account_number': accountNumber });

        if (!user) {
            console.error(`User with virtual account ${accountNumber} not found.`);
            // Return 200 to acknowledge webhook so VTPay doesn't retry indefinitely
            return res.status(200).json({ success: true, message: 'User not found' });
        }

        // 4. Update Wallet
        user.wallet_balance += creditAmount;
        await user.save();

        // 5. Log Transaction
        await VTfreeTransaction.create({
            user_id: user._id,
            type: 'credit',
            amount: creditAmount,
            reference: reference,
            description: `Wallet funding via VTPay (${data.bankName || 'Bank Transfer'})`,
            status: 'success',
            metadata: data,
            created_at: new Date()
        });

        console.log(`Credited wallet for user ${user.email} with ${creditAmount}`);

        res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
