import mongoose, { Schema } from 'mongoose';
const ApiKeySchema = new Schema({
    keyName: { type: String, required: true },
    fullKey: { type: String, required: true, unique: true },
    scopes: [{ type: String }],
    status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
    usageCount: { type: Number, default: 0 },
    rateLimit: { type: Number, default: 1000 },
    currentUsage: { type: Number, default: 0 },
    tenantName: { type: String, required: true },
    environment: { type: String, enum: ['test', 'live'], default: 'test' },
    lastUsed: { type: Date }
}, { timestamps: true });
export default mongoose.model('ApiKey', ApiKeySchema);
