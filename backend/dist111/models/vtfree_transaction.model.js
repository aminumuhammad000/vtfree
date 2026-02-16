import mongoose, { Schema } from 'mongoose';
const VTfreeTransactionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'VTfreeUser',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});
// Index for chronological queries
VTfreeTransactionSchema.index({ user_id: 1, created_at: -1 });
export default mongoose.model('VTfreeTransaction', VTfreeTransactionSchema);
