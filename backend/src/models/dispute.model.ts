import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
    transaction_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    reason: string;
    status: 'open' | 'resolved' | 'rejected';
    resolution_notes?: string;
    admin_id?: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const DisputeSchema: Schema = new Schema({
    transaction_id: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['open', 'resolved', 'rejected'],
        default: 'open'
    },
    resolution_notes: { type: String },
    admin_id: { type: Schema.Types.ObjectId, ref: 'AppAdmin' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
export default Dispute;
