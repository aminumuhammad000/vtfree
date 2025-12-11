import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    bvn?: string;
    kycLevel: number;
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
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        bvn: {
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

export const User = mongoose.model<IUserDocument>('User', UserSchema);
export default User;
