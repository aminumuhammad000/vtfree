import mongoose, { Schema, Document } from 'mongoose';

export interface IZainboxSettlementLedgerDocument extends Document {
    zainboxCode: string;
    amount: number;
    settlementId: string;
    status: 'pending' | 'completed' | 'failed';
    settledAt?: Date;
    transactionIds: mongoose.Types.ObjectId[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const ZainboxSettlementLedgerSchema = new Schema<IZainboxSettlementLedgerDocument>(
    {
        zainboxCode: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        settlementId: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        settledAt: {
            type: Date,
        },
        transactionIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Transaction',
            },
        ],
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

ZainboxSettlementLedgerSchema.index({ createdAt: -1 });
ZainboxSettlementLedgerSchema.index({ status: 1 });

export const ZainboxSettlementLedger = mongoose.model<IZainboxSettlementLedgerDocument>(
    'ZainboxSettlementLedger',
    ZainboxSettlementLedgerSchema
);
export default ZainboxSettlementLedger;
