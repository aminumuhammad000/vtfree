import mongoose, { Document, Schema } from 'mongoose';

export interface IProviderConfig extends Document {
  app_id?: string; // Optional: if null, it's a global default
  name: string; // e.g., Topupmate, VTpass, SME Plug
  code: string; // machine code e.g., topupmate, vtpass, smeplug
  base_url?: string;
  api_key?: string;
  secret_key?: string;
  username?: string;
  password?: string;
  active: boolean;
  priority: number; // lower means preferred
  supported_services: string[]; // ['airtime','data','cable','electricity','exampin']
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema = new Schema<IProviderConfig>(
  {
    app_id: { type: String, index: true }, // null means system default
    name: { type: String, required: true },
    code: { type: String, required: true, index: true },
    base_url: { type: String },
    api_key: { type: String },
    secret_key: { type: String },
    username: { type: String },
    password: { type: String },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 1, index: true },
    supported_services: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index: unique provider code per app
ProviderSchema.index({ app_id: 1, code: 1 }, { unique: true });
ProviderSchema.index({ app_id: 1, active: 1, priority: 1 });

export const ProviderConfig = mongoose.model<IProviderConfig>('ProviderConfig', ProviderSchema);
export default ProviderConfig;
