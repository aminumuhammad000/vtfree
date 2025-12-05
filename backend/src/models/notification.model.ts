// models/notification.model.ts
import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types.js';

const notificationSchema = new Schema<INotification>({
  app_id: { type: String, required: true, default: 'default_app', index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read_status: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  action_link: { type: String }
});

// Index for fetching user notifications within an app
notificationSchema.index({ app_id: 1, user_id: 1, created_at: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
