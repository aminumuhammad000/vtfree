import mongoose, { Schema } from 'mongoose';
const featureSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, enum: ['Publishing', 'Add-on', 'Service'], default: 'Publishing' },
    billing_cycle: { type: String, enum: ['monthly', 'yearly', 'one-time'], default: 'monthly' },
    icon: { type: String, default: 'solar:widget-5-bold' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
export const Feature = mongoose.model('Feature', featureSchema);
