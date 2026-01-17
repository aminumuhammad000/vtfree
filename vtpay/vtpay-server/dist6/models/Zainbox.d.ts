import mongoose, { Document } from 'mongoose';
export interface IZainboxDocument extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    emailNotification: string;
    tags: string;
    callbackUrl: string;
    codeName: string;
    zainboxCode: string;
    isActive: boolean;
    isLive: boolean;
    lastTransactionAt?: Date;
    totalTransactions: number;
    totalVolume: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Zainbox: mongoose.Model<IZainboxDocument, {}, {}, {}, mongoose.Document<unknown, {}, IZainboxDocument, {}, {}> & IZainboxDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Zainbox;
//# sourceMappingURL=Zainbox.d.ts.map