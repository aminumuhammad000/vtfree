import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
    key: string;
    value: string;
    description?: string;
    group: string;
    is_editable: boolean;
    is_public: boolean; // If true, can be sent to frontend
    created_at: Date;
    updated_at: Date;
}

const SystemConfigSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true, uppercase: true, trim: true },
        value: { type: String, default: '' },
        description: { type: String },
        group: { type: String, required: true, default: 'GENERAL' },
        is_editable: { type: Boolean, default: true },
        is_public: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Prevent deletion of config keys, only values can be cleared?
// User said: "even if admin delete it means he just delete the key and other thing but not the name of the key"
// This sounds like we should just clear the value on "delete".

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
