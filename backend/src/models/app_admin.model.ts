import mongoose, { Schema, Document } from 'mongoose';

export interface IAppAdmin extends Document {
    app_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    role: 'owner' | 'admin' | 'support';
    permissions: string[];
    status: 'active' | 'suspended';
    created_by: 'system' | mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
}

const AppAdminSchema: Schema = new Schema({
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
    first_name: {
        type: String,
        trim: true,
    },
    last_name: {
        type: String,
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

export default mongoose.model<IAppAdmin>('AppAdmin', AppAdminSchema);
