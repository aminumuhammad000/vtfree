import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformTransaction extends Document {
    vtfree_user_id: mongoose.Types.ObjectId;
    app_id: string;
    type: 'app_creation' | 'platform_upgrade' | 'subscription';
    platform: 'android' | 'ios' | 'web' | 'all';
    amount: number;
    currency: string;
    payment_method: string;
    payment_reference: string;
    payment_provider: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    completed_at?: Date;
}

const PlatformTransactionSchema: Schema = new Schema({
    vtfree_user_id: {
        type: Schema.Types.ObjectId,
        ref: 'VTfreeUser',
        required: true,
        index: true,
    },
    app_id: {
        type: String,
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['app_creation', 'platform_upgrade', 'subscription'],
        required: true,
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web', 'all'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    payment_method: {
        type: String,
        required: true,
    },
    payment_reference: {
        type: String,
        required: true,
        unique: true,
    },
    payment_provider: {
        type: String,
        default: 'vtstack',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
        index: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    completed_at: {
        type: Date,
    },
});

// Update timestamp on save
PlatformTransactionSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Indexes for faster queries
PlatformTransactionSchema.index({ vtfree_user_id: 1, status: 1 });
PlatformTransactionSchema.index({ app_id: 1, status: 1 });
PlatformTransactionSchema.index({ payment_reference: 1 });
PlatformTransactionSchema.index({ created_at: -1 });

export default mongoose.model<IPlatformTransaction>('PlatformTransaction', PlatformTransactionSchema);
