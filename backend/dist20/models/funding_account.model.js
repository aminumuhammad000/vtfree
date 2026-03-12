import mongoose, { Schema } from 'mongoose';
const FundingAccountSchema = new Schema({
    app_id: { type: String, index: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    instructions: { type: String },
    provider: { type: String, default: 'manual' },
    type: { type: String, enum: ['manual', 'virtual'], default: 'manual' },
    active: { type: Boolean, default: true },
}, { timestamps: true });
export const FundingAccount = mongoose.model('FundingAccount', FundingAccountSchema);
export default FundingAccount;
