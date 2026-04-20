import mongoose, { Schema } from 'mongoose';
const DisputeSchema = new Schema({
    transaction_id: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    app_id: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['open', 'resolved', 'rejected'],
        default: 'open'
    },
    resolution_notes: { type: String },
    admin_id: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
export const Dispute = mongoose.model('Dispute', DisputeSchema);
export default Dispute;
