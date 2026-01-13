import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
    name: string;
    description: string;
    price: number;
    category: 'Publishing' | 'Add-on' | 'Service';
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const featureSchema = new Schema<IFeature>({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, enum: ['Publishing', 'Add-on', 'Service'], default: 'Publishing' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Feature = mongoose.model<IFeature>('Feature', featureSchema);
