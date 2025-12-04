// models/wallet.model.ts
import mongoose, { Schema } from 'mongoose';
import { IWallet } from '../types.js';

const walletSchema = new Schema<IWallet>({
  app_id: { type: String, required: true, default: 'default_app', index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'NGN' },
  last_transaction_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add compound index for app_id + user_id uniqueness per app
walletSchema.index({ app_id: 1, user_id: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);