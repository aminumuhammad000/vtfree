import mongoose, { Schema, Document } from 'mongoose';

export interface IVTfreeUser extends Document {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    company_name?: string;
    status: 'active' | 'suspended' | 'pending';
    email_verified: boolean;
    verification_token?: string;
    reset_password_token?: string;
    reset_password_expires?: Date;
    wallet_balance: number;
    profile_picture?: string;
    bvn?: string;
    virtual_account?: {
        bank: string;
        account_number: string;
        account_name: string;
    } | null;
    created_at: Date;
    updated_at: Date;
}

const VTfreeUserSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    first_name: {
        type: String,
        required: true,
        trim: true,
    },
    last_name: {
        type: String,
        required: false,
        trim: true,
    },
    phone_number: {
        type: String,
        required: true,
        trim: true,
    },
    company_name: {
        type: String,
        trim: true,
    },
    wallet_balance: {
        type: Number,
        default: 0,
    },
    profile_picture: {
        type: String,
        default: null,
    },
    bvn: {
        type: String,
        trim: true,
        default: null
    },
    virtual_account: {
        bank: String,
        account_number: String,
        account_name: String,
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'pending',
    },
    email_verified: {
        type: Boolean,
        default: false,
    },
    verification_token: {
        type: String,
    },
    reset_password_token: {
        type: String,
    },
    reset_password_expires: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Update timestamp on save
VTfreeUserSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Index for faster queries

VTfreeUserSchema.index({ status: 1 });

export default mongoose.model<IVTfreeUser>('VTfreeUser', VTfreeUserSchema);
