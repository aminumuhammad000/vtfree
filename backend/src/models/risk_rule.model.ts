import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskRule extends Document {
    name: string;
    type: 'velocity' | 'amount_limit' | 'blacklist' | 'whitelist' | 'geo_block';
    condition: string;
    action: 'block' | 'flag' | 'review';
    priority: number;
    status: 'active' | 'inactive';
    hits: number;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RiskRuleSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['velocity', 'amount_limit', 'blacklist', 'whitelist', 'geo_block'], required: true },
    condition: { type: String, required: true },
    action: { type: String, enum: ['block', 'flag', 'review'], required: true },
    priority: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    hits: { type: Number, default: 0 },
    lastTriggered: { type: Date }
}, { timestamps: true });

export default mongoose.model<IRiskRule>('RiskRule', RiskRuleSchema);
