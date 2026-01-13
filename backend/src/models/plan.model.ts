import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  price: number;
  billing: 'monthly' | 'annual' | 'one-time';
  features: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const planSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  billing: { type: String, enum: ['monthly', 'annual', 'one-time'], default: 'monthly' },
  features: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Plan = mongoose.model<IPlan>('Plan', planSchema);