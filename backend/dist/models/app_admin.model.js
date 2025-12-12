import mongoose, { Schema } from 'mongoose';
const AppAdminSchema = new Schema({
    app_id: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'support'],
        default: 'owner',
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
    created_by: {
        type: Schema.Types.Mixed,
        default: 'system',
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
AppAdminSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});
// Compound index for app_id + email (unique per app)
AppAdminSchema.index({ app_id: 1, email: 1 }, { unique: true });
AppAdminSchema.index({ app_id: 1, status: 1 });
export default mongoose.model('AppAdmin', AppAdminSchema);
