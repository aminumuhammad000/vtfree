import mongoose, { Schema } from 'mongoose';
const supportTicketSchema = new Schema({
    app_id: { type: String, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    ticket_id: { type: String, unique: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
