// controllers/transaction.controller.ts
import mongoose from 'mongoose';
import { Response } from 'express';
import { Transaction, Wallet, Operator, User } from '../models/index.js';
import { WalletService } from '../services/wallet.service.js';
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { transactionValidation } from '../utils/validators.js';

export class TransactionController {
  static async createTransaction(req: AuthRequest, res: Response) {
    try {
      const { error } = transactionValidation.create.validate(req.body);
      if (error) {
        return ApiResponse.error(res, error.details[0].message, 400);
      }

      const { type, amount, destination_account, operator_id, plan_id, payment_method } = req.body;

      const user = await User.findById(req.user?.id);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      const wallet = await Wallet.findOne({ user_id: req.user?.id });
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      const fee = amount * 0.01; // 1% fee
      const total_charged = amount + fee;

      if (wallet.balance < total_charged) {
        return ApiResponse.error(res, 'Insufficient balance', 400);
      }

      const transaction = await Transaction.create({
        user_id: req.user?.id,
        app_id: user.app_id,
        wallet_id: wallet._id,
        type,
        amount,
        fee,
        total_charged,
        status: 'pending',
        reference_number: `TXN-${Date.now()}`,
        payment_method,
        destination_account,
        operator_id,
        plan_id
      });

      // Debit wallet
      await WalletService.debitWallet(wallet.user_id, total_charged);

      // Process transaction based on type
      // This is where you'd integrate with VTU providers
      transaction.status = 'successful';
      await transaction.save();

      // Send notification
      await NotificationService.sendTransactionNotification(wallet.user_id, transaction);

      return ApiResponse.success(res, transaction, 'Transaction created successfully', 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find({ user_id: req.user?.id })
        .populate('operator_id')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await Transaction.countDocuments({ user_id: req.user?.id });

      return ApiResponse.paginated(res, transactions, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Transactions retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getTransactionById(req: AuthRequest, res: Response) {
    try {
      const query: any = { _id: req.params.id };
      if (req.user?.app_id) {
        query.app_id = req.user.app_id;
      } else {
        query.user_id = req.user?.id;
      }

      const transaction = await Transaction.findOne(query).populate('operator_id');

      if (!transaction) {
        return ApiResponse.error(res, 'Transaction not found', 404);
      }

      return ApiResponse.success(res, transaction, 'Transaction retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getAllTransactions(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.type) filter.type = req.query.type;
      if (req.query.user_id) filter.user_id = req.query.user_id;

      // Filter by app_id if present in user token (for App Admins)
      if (req.user?.app_id) {
        filter.app_id = req.user.app_id;
      }

      if (req.query.search) {
        console.log('[TransactionController] Search query:', req.query.search);
        const search = req.query.search as string;

        let userIds: any[] = [];
        try {
          // Dynamic import to avoid circular dependency
          const { User } = await import('../models/user.model.js');

          const userQuery: any = {
            $or: [
              { email: { $regex: search, $options: 'i' } },
              { first_name: { $regex: search, $options: 'i' } },
              { last_name: { $regex: search, $options: 'i' } },
              { phone_number: { $regex: search, $options: 'i' } }
            ]
          };

          if (req.user?.app_id) {
            userQuery.app_id = req.user.app_id;
          }

          const users = await User.find(userQuery).select('_id');
          console.log(`[TransactionController] Found ${users.length} users`);
          userIds = users.map(u => u._id);
        } catch (err: any) {
          console.error('[TransactionController] Error finding users:', err.message);
        }

        const searchFilter = {
          $or: [
            { user_id: { $in: userIds } },
            { reference_number: { $regex: search, $options: 'i' } }
          ]
        };

        // Filter transactions by these users OR by reference number
        // Note: We must ensure app_id filter (if any) is still respected.
        // Since filter.app_id is already set above, we can use $and if we want to be strict,
        // but Mongoose handles top-level implicit AND. 
        // However, mixing top-level fields with $or can be tricky.
        // Let's use $and to be safe if we have an app_id filter.

        if (filter.app_id) {
          // If we have an app_id, we need to ensure it applies to the search results too.
          // But wait, user search already filtered by app_id. 
          // Reference number search doesn't inherently filter by app_id.
          // So we should combine them.
          filter.$and = [
            searchFilter
          ];
        } else {
          Object.assign(filter, searchFilter);
        }
      }

      const transactions = await Transaction.find(filter)
        .populate('user_id', 'first_name last_name email')
        .populate('operator_id')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await Transaction.countDocuments(filter);

      return ApiResponse.paginated(res, transactions, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Transactions retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateTransactionStatus(req: AuthRequest, res: Response) {
    try {
      const { status, remarks } = req.body;
      const allowedStatuses = ['pending', 'completed', 'failed', 'cancelled'];

      if (!allowedStatuses.includes(status)) {
        return ApiResponse.error(res, 'Invalid status', 400);
      }

      const query: any = { _id: req.params.id };
      if (req.user?.app_id) {
        query.app_id = req.user.app_id;
      }

      const transaction = await Transaction.findOneAndUpdate(
        query,
        {
          status,
          remarks: remarks || '',
          updated_at: new Date()
        },
        { new: true }
      );

      if (!transaction) {
        return ApiResponse.error(res, 'Transaction not found', 404);
      }

      return ApiResponse.success(res, transaction, 'Transaction status updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}