import mongoose, { Schema, Document } from 'mongoose';

export interface IZainboxDocument extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    emailNotification: string;
    tags: string;
    callbackUrl: string;
    codeName: string; // The codeName sent to Zainpay
    zainboxCode: string; // The unique code returned by Zainpay
    isActive: boolean;
    isLive: boolean;
    currentBalance: number;
    lastTransactionAt?: Date;
    totalTransactions: number;
    totalVolume: number; // in kobo
    createdAt: Date;
    updatedAt: Date;
}

const ZainboxSchema = new Schema<IZainboxDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        emailNotification: {
            type: String,
            trim: true,
        },
        tags: {
            type: String,
            required: true,
            trim: true,
        },
        callbackUrl: {
            type: String,
            required: true,
            trim: true,
        },
        codeName: {
            type: String,
            required: true,
            trim: true,
        },
        zainboxCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isLive: {
            type: Boolean,
            default: false,
        },
        currentBalance: {
            type: Number,
            default: 0,
        },
        lastTransactionAt: {
            type: Date,
        },
        totalTransactions: {
            type: Number,
            default: 0,
        },
        totalVolume: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ZainboxSchema.index({ userId: 1 });

export const Zainbox = mongoose.model<IZainboxDocument>('Zainbox', ZainboxSchema);
export default Zainbox;
