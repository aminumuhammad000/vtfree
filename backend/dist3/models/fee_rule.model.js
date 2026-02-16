import mongoose, { Schema } from 'mongoose';
const FeeRuleSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['flat', 'percentage', 'tiered'], required: true },
    value: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    cap: { type: Number },
    category: { type: String, enum: ['deposit', 'transfer', 'withdrawal', 'utility'], required: true },
    paymentMethod: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });
export default mongoose.model('FeeRule', FeeRuleSchema);
