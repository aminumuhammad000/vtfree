import mongoose, { Schema } from 'mongoose';
const RiskRuleSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['velocity', 'amount_limit', 'blacklist', 'whitelist', 'geo_block'], required: true },
    condition: { type: String, required: true },
    action: { type: String, enum: ['block', 'flag', 'review'], required: true },
    priority: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    hits: { type: Number, default: 0 },
    lastTriggered: { type: Date }
}, { timestamps: true });
export default mongoose.model('RiskRule', RiskRuleSchema);
