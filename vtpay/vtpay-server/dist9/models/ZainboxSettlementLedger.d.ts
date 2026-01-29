import mongoose, { Document } from 'mongoose';
export interface IZainboxSettlementLedgerDocument extends Document {
    zainboxCode: string;
    amount: number;
    settlementId: string;
    status: 'pending' | 'completed' | 'failed';
    settledAt?: Date;
    transactionIds: mongoose.Types.ObjectId[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ZainboxSettlementLedger: mongoose.Model<IZainboxSettlementLedgerDocument, {}, {}, {}, mongoose.Document<unknown, {}, IZainboxSettlementLedgerDocument, {}, {}> & IZainboxSettlementLedgerDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default ZainboxSettlementLedger;
//# sourceMappingURL=ZainboxSettlementLedger.d.ts.map