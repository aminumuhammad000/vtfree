import mongoose, { Schema, Document } from 'mongoose';

export interface IZainboxDocument extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    emailNotification: string;
    tags: string;
    callbackUrl: string;
    codeName: string; // The codeName sent to Zainpay
    zainboxCode: string; // The unique code returned by Zainpay
    isLive: boolean;
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
            required: true,
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
            required: true,
            unique: true,
            trim: true,
        },
        isLive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ZainboxSchema.index({ userId: 1 });
ZainboxSchema.index({ zainboxCode: 1 });

export const Zainbox = mongoose.model<IZainboxDocument>('Zainbox', ZainboxSchema);
export default Zainbox;
