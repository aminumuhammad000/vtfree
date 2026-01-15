import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  app_id?: string;
  user_id: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  ticket_id: string;
  created_at: Date;
  updated_at: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
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

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
