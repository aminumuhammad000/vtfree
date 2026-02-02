import mongoose, { Document, Schema } from 'mongoose';

export interface IFeature extends Document {
    feature_id: string;
    name: string;
    slug: string;
    description?: string;
    icon_name: string;
    base_price: number;
    is_active: boolean;
    category: 'billpayment' | 'finance' | 'utility' | 'communication';
    display_order: number;
    requires_api: boolean;
    created_at: Date;
    updated_at: Date;
}

const FeatureSchema: Schema = new Schema({
    feature_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    description: {
        type: String
    },
    icon_name: {
        type: String,
        required: true
    },
    base_price: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    category: {
        type: String,
        enum: ['billpayment', 'finance', 'utility', 'communication'],
        default: 'utility'
    },
    display_order: {
        type: Number,
        default: 0
    },
    requires_api: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at on save
FeatureSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

export default mongoose.model<IFeature>('Feature', FeatureSchema);
