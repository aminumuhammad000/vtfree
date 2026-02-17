import mongoose, { Schema } from 'mongoose';
const ZainboxSchema = new Schema({
    name: { type: String, required: true },
    emailNotification: { type: String, required: true },
    callbackUrl: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });
export default mongoose.model('Zainbox', ZainboxSchema);
