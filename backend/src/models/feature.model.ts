import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
    name: string;
    description: string;
    price: number;
    category: 'Publishing' | 'Add-on' | 'Service';
<<<<<<< HEAD
    billing_cycle: 'monthly' | 'yearly' | 'one-time';
    icon: string;
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const featureSchema = new Schema<IFeature>({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, enum: ['Publishing', 'Add-on', 'Service'], default: 'Publishing' },
<<<<<<< HEAD
    billing_cycle: { type: String, enum: ['monthly', 'yearly', 'one-time'], default: 'monthly' },
    icon: { type: String, default: 'solar:widget-5-bold' },
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Feature = mongoose.model<IFeature>('Feature', featureSchema);
