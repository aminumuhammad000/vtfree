// modelssupport_ticket.model.ts
import mongoose, { Schema } from 'mongoose';
import { ISupportTicket } from '../types.js';

const supportTicketSchema = new Schema<ISupportTicket>({
  app_id: { type: String, required: true, default: 'default_app', index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  admin_id: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['new', 'open', 'pending_user', 'resolved', 'closed'],
    default: 'new'
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for fetching app-specific tickets
supportTicketSchema.index({ app_id: 1, status: 1 });
supportTicketSchema.index({ app_id: 1, user_id: 1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
