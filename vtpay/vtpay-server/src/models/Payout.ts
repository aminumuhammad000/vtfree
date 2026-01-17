import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutDocument extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number; // Gross amount to be deducted from wallet
    vtpayFee: number;
    zainpayPercentFee: number;
    zainpayFixedFee: number;
    netAmount: number; // Amount user actually receives
    totalDeducted: number; // Should be equal to amount
    bankCode: string;
    accountNumber: string;
    accountName: string;
    payoutType: 'internal' | 'external';
    reference: string;
    externalRef?: string;
    idempotencyKey?: string;
    status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'MANUAL_REVIEW';
    failureReason?: string;
    retryCount: number;
    lastReconciledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

const PayoutSchema = new Schema<IPayoutDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        vtpayFee: {
            type: Number,
            default: 0,
        },
        zainpayPercentFee: {
            type: Number,
            default: 0,
        },
        zainpayFixedFee: {
            type: Number,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        totalDeducted: {
            type: Number,
            required: true,
            min: 0,
        },
        bankCode: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
            required: true,
        },
        accountName: {
            type: String,
            required: true,
        },
        payoutType: {
            type: String,
            enum: ['internal', 'external'],
            required: true,
        },
        reference: {
            type: String,
            required: true,
            unique: true,
        },
        externalRef: {
            type: String,
            index: true,
        },
        idempotencyKey: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: ['INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW'],
            default: 'INITIATED',
            index: true,
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        lastReconciledAt: {
            type: Date,
        },
        failureReason: {
            type: String,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
PayoutSchema.index({ userId: 1 });
PayoutSchema.index({ createdAt: -1 });

export const Payout = mongoose.model<IPayoutDocument>('Payout', PayoutSchema);
export default Payout;
