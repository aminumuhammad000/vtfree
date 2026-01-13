import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
    user_id: mongoose.Types.ObjectId;
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    reference: string;
    reason?: string;
    created_at: Date;
    updated_at: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>({
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

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
