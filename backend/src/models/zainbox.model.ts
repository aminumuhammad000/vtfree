import mongoose, { Schema, Document } from 'mongoose';

export interface IZainbox extends Document {
    name: string;
    emailNotification: string;
    callbackUrl: string;
    tags: string[];
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const ZainboxSchema: Schema = new Schema({
    name: { type: String, required: true },
    emailNotification: { type: String, required: true },
    callbackUrl: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model<IZainbox>('Zainbox', ZainboxSchema);
