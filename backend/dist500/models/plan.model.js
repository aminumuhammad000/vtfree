import mongoose, { Schema } from 'mongoose';
const planSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    billing: { type: String, enum: ['monthly', 'annual', 'one-time'], default: 'monthly' },
    features: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
export const Plan = mongoose.model('Plan', planSchema);
