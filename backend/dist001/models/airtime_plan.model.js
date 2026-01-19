import mongoose, { Schema } from 'mongoose';
const AirtimePlanSchema = new Schema({
    app_id: { type: String, index: true }, // null means system default
    providerId: { type: Number, required: true, index: true },
    providerName: { type: String, required: true },
    externalPlanId: { type: String },
    code: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ['AIRTIME', 'DATA', 'CABLE', 'UTILITY'], required: true, index: true },
    discount: { type: Number, default: 0 },
    meta: { type: Schema.Types.Mixed },
    active: { type: Boolean, default: true },
}, { timestamps: true });
// Index for quick lookups
AirtimePlanSchema.index({ app_id: 1, providerId: 1, type: 1, active: 1 });
AirtimePlanSchema.index({ app_id: 1, externalPlanId: 1 });
export const AirtimePlan = mongoose.model('AirtimePlan', AirtimePlanSchema);
export default AirtimePlan;
