import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
    referrerId: { type: String, required: true },
    referredUserId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

export const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
