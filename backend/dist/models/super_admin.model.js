import mongoose, { Schema } from 'mongoose';
const SuperAdminSchema = new Schema({
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
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        default: 'super_admin',
        immutable: true,
    },
    permissions: {
        type: [String],
        default: ['all'],
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    last_login: {
        type: Date,
    },
});
// Update timestamp on save
SuperAdminSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});
// Index for faster queries
SuperAdminSchema.index({ email: 1 });
SuperAdminSchema.index({ status: 1 });
export default mongoose.model('SuperAdmin', SuperAdminSchema);
