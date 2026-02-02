// services wallet.service.ts
import { Wallet, Transaction } from '../models/index.js';
import { Types } from 'mongoose';

export class WalletService {
  static async createWallet(user_id: Types.ObjectId) {
    return await Wallet.create({
      user_id,
      balance: 0,
      currency: 'NGN'
    });
  }

  static async getBalance(user_id: Types.ObjectId): Promise<number> {
    const wallet = await Wallet.findOne({ user_id });
    return wallet?.balance || 0;
  }

  static async creditWallet(user_id: Types.ObjectId, amount: number): Promise<boolean> {
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) throw new Error('Wallet not found');

    wallet.balance += amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();
    return true;
  }

  static async debitWallet(user_id: Types.ObjectId, amount: number): Promise<boolean> {
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.balance < amount) throw new Error('Insufficient balance');

    wallet.balance -= amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();
    return true;
  }

  // Alias methods for compatibility
  static async getWalletByUserId(user_id: Types.ObjectId | string) {
    return await Wallet.findOne({ user_id });
  }

  static async debit(user_id: Types.ObjectId | string, amount: number, description?: string) {
    return await this.debitWallet(user_id as Types.ObjectId, amount);
  }

  static async credit(user_id: Types.ObjectId | string, amount: number, description: string = 'System Credit', type: string = 'wallet_topup', appId?: string) {
    const uid = typeof user_id === 'string' ? new Types.ObjectId(user_id) : user_id;
    await this.creditWallet(uid, amount);

    const wallet = await Wallet.findOne({ user_id: uid });
    if (wallet) {
      await Transaction.create({
        user_id: uid,
        wallet_id: wallet._id,
        type: type,
        amount: amount,
        fee: 0,
        total_charged: amount,
        status: 'successful',
        reference_number: `SYS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        description: description,
        payment_method: 'system',
        app_id: appId
      });
    }
    return true;
  }
}