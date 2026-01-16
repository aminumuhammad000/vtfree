import mongoose, { Schema, Document } from 'mongoose';

export interface ISuperAdmin extends Document {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'super_admin';
    permissions: string[];
    status: 'active' | 'suspended';
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
}

const SuperAdminSchema: Schema = new Schema({
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
        trim: true,
    },
    last_name: {
        type: String,
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

export default mongoose.model<ISuperAdmin>('SuperAdmin', SuperAdminSchema);
