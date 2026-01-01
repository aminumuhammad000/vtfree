import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    fullName: string; // Added for combined name
    phone: string;
    bvn?: string;
    nin?: string; // Added for KYC
    idCardPath?: string; // Added for KYC
    verificationToken?: string; // Added for email verification
    apiKey?: string;
    businessName?: string;
    kycLevel: number; // 0: Registered, 1: Verified, 2: Submitted, 3: Approved
    status: 'active' | 'suspended' | 'pending';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        bvn: {
            type: String,
            trim: true,
        },
        nin: {
            type: String,
            trim: true,
        },
        idCardPath: {
            type: String,
        },
        verificationToken: {
            type: String,
        },
        apiKey: {
            type: String,
            unique: true,
            sparse: true,
        },
        businessName: {
            type: String,
            trim: true,
        },
        kycLevel: {
            type: Number,
            default: 0,
            min: 0,
            max: 3,
        },
        status: {
            type: String,
            enum: ['active', 'suspended', 'pending'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries (email index is implicit from unique: true)
UserSchema.index({ phone: 1 });
UserSchema.index({ verificationToken: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
export default User;
