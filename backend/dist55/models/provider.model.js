import mongoose, { Schema } from 'mongoose';
const ProviderSchema = new Schema({
    app_id: { type: String, index: true }, // null means system default
    name: { type: String, required: true },
    code: { type: String, required: true, index: true },
    base_url: { type: String },
    api_key: { type: String },
    secret_key: { type: String },
    username: { type: String },
    password: { type: String },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 1, index: true },
    supported_services: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });
// Compound index: unique provider code per app
ProviderSchema.index({ app_id: 1, code: 1 }, { unique: true });
ProviderSchema.index({ app_id: 1, active: 1, priority: 1 });
export const ProviderConfig = mongoose.model('ProviderConfig', ProviderSchema);
export default ProviderConfig;
