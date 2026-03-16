import mongoose, { Document, Schema } from 'mongoose';

export interface IAirtimePlan extends Document {
  app_id?: string; // Optional: if null, it's a global default
  providerId: number; // 1=mtn, 2=airtel, 3=glo, 4=9mobile
  providerName: string;
  externalPlanId?: string; // provider's plan id (like 51, 70, ...)
  code?: string; // short code or sku
  name: string; // "MTN 500 MB (SME) (7 days)"
  price: number; // in Naira
  type: 'AIRTIME' | 'DATA' | 'CABLE' | 'UTILITY'; // AIRTIME, DATA, CABLE or UTILITY
  discount?: number; // discount percentage
  source_provider?: string; // e.g., 'vtstack', 'smeplug', etc.
  meta?: Record<string, any>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AirtimePlanSchema = new Schema<IAirtimePlan>(
  {
    app_id: { type: String, index: true }, // null means system default
    providerId: { type: Number, required: true, index: true },
    providerName: { type: String, required: true },
    externalPlanId: { type: String },
    code: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ['AIRTIME', 'DATA', 'CABLE', 'UTILITY'], required: true, index: true },
    discount: { type: Number, default: 0 },
    source_provider: { type: String, index: true },
    meta: { type: Schema.Types.Mixed },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for quick lookups
AirtimePlanSchema.index({ app_id: 1, providerId: 1, type: 1, active: 1 });
AirtimePlanSchema.index({ app_id: 1, externalPlanId: 1 });

export const AirtimePlan = mongoose.model<IAirtimePlan>('AirtimePlan', AirtimePlanSchema);
export default AirtimePlan;
