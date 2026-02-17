import mongoose, { Schema } from 'mongoose';
const withdrawalSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'VTfreeUser', required: true },
    amount: { type: Number, required: true },
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    account_name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
    reference: { type: String, required: true, unique: true },
    reason: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
