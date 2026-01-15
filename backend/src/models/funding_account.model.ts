import mongoose, { Schema, Document } from 'mongoose';

export interface IFundingAccount extends Document {
  app_id?: string; // null means system-wide
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FundingAccountSchema = new Schema<IFundingAccount>({
  app_id: { type: String, index: true },
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  instructions: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const FundingAccount = mongoose.model<IFundingAccount>('FundingAccount', FundingAccountSchema);
export default FundingAccount;
