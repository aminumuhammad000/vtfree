import mongoose, { Schema } from 'mongoose';
const VTfreeUserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    first_name: {
        type: String,
        required: true,
        trim: true,
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
    },
    phone_number: {
        type: String,
        required: true,
        trim: true,
    },
    company_name: {
        type: String,
        trim: true,
    },
    wallet_balance: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'pending',
    },
    email_verified: {
        type: Boolean,
        default: false,
    },
    verification_token: {
        type: String,
    },
    reset_password_token: {
        type: String,
    },
    reset_password_expires: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});
// Update timestamp on save
VTfreeUserSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});
// Index for faster queries
VTfreeUserSchema.index({ status: 1 });
export default mongoose.model('VTfreeUser', VTfreeUserSchema);
