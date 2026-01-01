import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
    keyName: string;
    fullKey: string;
    scopes: string[];
    status: 'active' | 'revoked' | 'expired';
    usageCount: number;
    rateLimit: number;
    currentUsage: number;
    tenantName: string;
    environment: 'test' | 'live';
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema: Schema = new Schema({
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

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
