// controllers/admin.controller.ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/bootstrap.js';
import { AdminUser, AuditLog, Transaction, User, Zainbox, ApiKey, FeeRule, RiskRule } from '../models/index.js';
import { AdminService } from '../services/admin.service.js';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';
import crypto from 'crypto';

export class AdminController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      console.log('Admin login attempt:', { email });

      const admin = await AdminUser.findOne({ email }).populate('role_id');
      console.log('Admin found:', admin ? 'Yes' : 'No');

      if (!admin) {
        console.log('Admin not found in database');
        return ApiResponse.error(res, 'Invalid credentials', 401);
      }

      console.log('Comparing passwords...');
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Password mismatch');
        return ApiResponse.error(res, 'Invalid credentials', 401);
      }

      if (admin.status !== 'active') {
        console.log('Admin account inactive');
        return ApiResponse.error(res, 'Account is inactive', 403);
      }

      admin.last_login_at = new Date();
      await admin.save();

      const token = jwt.sign(
        {
          id: admin._id,
          role: 'admin',
          type: 'super_admin'
        },
        config.jwtSecret as string,
        { expiresIn: config.jwtExpiry } as SignOptions
      );

      console.log('Admin login successful');
      return ApiResponse.success(res, { admin, token }, 'Login successful');
    } catch (error: any) {
      console.error('Admin login error:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const totalTransactions = await Transaction.countDocuments();
      const successfulTransactions = await Transaction.countDocuments({ status: 'successful' });

      // Calculate total data sales (sum of successful data transactions)
      const dataSalesResult = await Transaction.aggregate([
        {
          $match: {
            type: 'data_purchase',
            status: 'successful'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);
      const totalDataSales = dataSalesResult.length > 0 ? dataSalesResult[0].totalAmount : 0;

      // Calculate total airtime sales (sum of successful airtime transactions)
      const airtimeSalesResult = await Transaction.aggregate([
        {
          $match: {
            type: 'airtime_topup',
            status: 'successful'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);
      const totalAirtimeSales = airtimeSalesResult.length > 0 ? airtimeSalesResult[0].totalAmount : 0;

      const stats = {
        totalUsers,
        activeUsers,
        totalTransactions,
        successfulTransactions,
        totalDataSales,
        totalAirtimeSales
      };

      return ApiResponse.success(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      const user = await User.findById(req.params.id);

      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      const oldStatus = user.status;
      user.status = status;
      user.updated_at = new Date();
      await user.save();

      // Log action
      await AdminService.logAction({
        admin_id: req.user?.id as any,
        action: 'user_status_updated',
        entity_type: 'User',
        entity_id: user._id,
        old_value: { status: oldStatus },
        new_value: { status },
        ip_address: req.ip
      });

      return ApiResponse.success(res, user, 'User status updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const logs = await AuditLog.find()
        .populate('admin_id', 'first_name last_name email')
        .populate('user_id', 'first_name last_name email')
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 });

      const total = await AuditLog.countDocuments();

      return ApiResponse.paginated(res, logs, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Audit logs retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { first_name: searchRegex },
          { last_name: searchRegex },
          { email: searchRegex }
        ];
      }

      const users = await User.find(query)
        .select('-password_hash')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await User.countDocuments(query);

      return ApiResponse.paginated(res, users, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Users retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getUserById(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.params.id).select('-password_hash');
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const allowedUpdates = ['first_name', 'last_name', 'email', 'phone_number', 'status', 'kyc_status'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { ...updates, updated_at: new Date() },
        { new: true }
      ).select('-password_hash');

      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteAuditLog(req: AuthRequest, res: Response) {
    try {
      const log = await AuditLog.findByIdAndDelete(req.params.id);
      if (!log) {
        return ApiResponse.error(res, 'Audit log not found', 404);
      }

      return ApiResponse.success(res, null, 'Audit log deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  /**
   * Manually credit user wallet (for testing/admin purposes)
   */
  static async creditUserWallet(req: AuthRequest, res: Response) {
    try {
      const { userId, amount, description } = req.body;

      if (!userId || !amount) {
        return ApiResponse.error(res, 'User ID and amount are required', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      // Import WalletService
      const { WalletService } = await import('../services/wallet.service.js');

      // Get wallet before credit
      const walletBefore = await WalletService.getWalletByUserId(userId);
      if (!walletBefore) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }
      const oldBalance = walletBefore.balance;

      // Credit wallet
      await WalletService.credit(
        userId,
        parseFloat(amount),
        description || 'Admin manual credit'
      );

      // Get updated wallet
      const walletAfter = await WalletService.getWalletByUserId(userId);

      // Log action
      await AdminService.logAction({
        admin_id: req.user?.id as any,
        action: 'wallet_credited',
        entity_type: 'Wallet',
        entity_id: walletBefore._id,
        old_value: { balance: oldBalance },
        new_value: { balance: walletAfter?.balance },
        ip_address: req.ip
      });

      return ApiResponse.success(res, { wallet: walletAfter }, 'Wallet credited successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  /**
   * Create a new admin user
   * @route POST /api/admin/admins
   * @access Private - Super Admin only
   */
  static async createAdminUser(req: AuthRequest, res: Response) {
    try {
      const { email, first_name, last_name, password } = req.body;

      // Validate required fields
      if (!email || !first_name || !last_name || !password) {
        return ApiResponse.error(res, 'Email, first name, last name, and password are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.error(res, 'Invalid email format', 400);
      }

      // Check if admin already exists
      const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return ApiResponse.error(res, 'Admin with this email already exists', 409);
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create new admin
      const newAdmin = await AdminUser.create({
        email: email.toLowerCase(),
        password_hash,
        first_name,
        last_name,
        status: 'active',
      });

      // Log action
      await AdminService.logAction({
        admin_id: req.user?.id as any,
        action: 'admin_created',
        entity_type: 'AdminUser',
        entity_id: newAdmin._id,
        old_value: {},
        new_value: { email, first_name, last_name },
        ip_address: req.ip
      });

      return ApiResponse.success(res, {
        _id: newAdmin._id,
        email: newAdmin.email,
        first_name: newAdmin.first_name,
        last_name: newAdmin.last_name,
        password, // Return plain password only on creation
        status: newAdmin.status,
      }, 'Admin user created successfully', 201);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      return ApiResponse.error(res, error.message || 'Error creating admin user', 500);
    }
  }

  /**
   * Get all admin users
   * @route GET /api/admin/admins
   * @access Private - Super Admin only
   */
  static async getAllAdmins(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const admins = await AdminUser.find()
        .select('-password_hash')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await AdminUser.countDocuments();

      return ApiResponse.paginated(res, admins, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Admin users retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      return ApiResponse.error(res, error.message || 'Error fetching admin users', 500);
    }
  }

  /**
   * Get current admin profile
   * @route GET /api/admin/profile
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const admin = await AdminUser.findById(req.user?.id).select('-password_hash');
      if (!admin) return ApiResponse.error(res, 'Admin not found', 404);
      return ApiResponse.success(res, admin, 'Profile retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  /**
   * Update current admin profile (first_name, last_name, email)
   * @route PUT /api/admin/profile
   */
  static async updateAdminProfile(req: AuthRequest, res: Response) {
    try {
      const allowed = ['first_name', 'last_name', 'email'];
      const updates = Object.keys(req.body)
        .filter((k) => allowed.includes(k))
        .reduce((acc: any, k) => {
          acc[k] = req.body[k];
          return acc;
        }, {});

      const admin = await AdminUser.findByIdAndUpdate(
        req.user?.id,
        { ...updates, updated_at: new Date() },
        { new: true }
      ).select('-password_hash');

      if (!admin) return ApiResponse.error(res, 'Admin not found', 404);
      return ApiResponse.success(res, admin, 'Profile updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  /**
   * Change current admin password
   * @route PUT /api/admin/profile/password
   */
  static async changeAdminPassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
      if (!currentPassword || !newPassword) {
        return ApiResponse.error(res, 'currentPassword and newPassword are required', 400);
      }

      const admin = await AdminUser.findById(req.user?.id);
      if (!admin) return ApiResponse.error(res, 'Admin not found', 404);

      const ok = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!ok) return ApiResponse.error(res, 'Current password is incorrect', 400);

      admin.password_hash = await bcrypt.hash(newPassword, 10);
      admin.updated_at = new Date();
      await admin.save();

      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Zainbox Management
  static async createZainbox(req: AuthRequest, res: Response) {
    try {
      const zainbox = await Zainbox.create(req.body);
      return ApiResponse.success(res, zainbox, 'Zainbox created successfully', 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getAllZainboxes(req: AuthRequest, res: Response) {
    try {
      const zainboxes = await Zainbox.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, zainboxes, 'Zainboxes retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // API Key Management
  static async generateApiKey(req: AuthRequest, res: Response) {
    try {
      const { name, environment, scopes } = req.body;
      const fullKey = `vt_${environment}_${crypto.randomBytes(24).toString('hex')}`;

      const apiKey = await ApiKey.create({
        keyName: name,
        fullKey,
        environment,
        scopes,
        tenantName: 'VTPay Admin', // Default for now
        status: 'active'
      });

      return ApiResponse.success(res, apiKey, 'API Key generated successfully', 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getApiKeys(req: AuthRequest, res: Response) {
    try {
      const keys = await ApiKey.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, keys, 'API Keys retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async revokeApiKey(req: AuthRequest, res: Response) {
    try {
      const apiKey = await ApiKey.findByIdAndUpdate(req.params.id, { status: 'revoked' }, { new: true });
      if (!apiKey) return ApiResponse.error(res, 'API Key not found', 404);
      return ApiResponse.success(res, apiKey, 'API Key revoked successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Fee Management
  static async createFee(req: AuthRequest, res: Response) {
    try {
      const fee = await FeeRule.create(req.body);
      return ApiResponse.success(res, fee, 'Fee rule created successfully', 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getFees(req: AuthRequest, res: Response) {
    try {
      const fees = await FeeRule.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, fees, 'Fee rules retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateFee(req: AuthRequest, res: Response) {
    try {
      const fee = await FeeRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!fee) return ApiResponse.error(res, 'Fee rule not found', 404);
      return ApiResponse.success(res, fee, 'Fee rule updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteFee(req: AuthRequest, res: Response) {
    try {
      const fee = await FeeRule.findByIdAndDelete(req.params.id);
      if (!fee) return ApiResponse.error(res, 'Fee rule not found', 404);
      return ApiResponse.success(res, null, 'Fee rule deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Risk Rule Management
  static async createRiskRule(req: AuthRequest, res: Response) {
    try {
      const rule = await RiskRule.create(req.body);
      return ApiResponse.success(res, rule, 'Risk rule created successfully', 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getRiskRules(req: AuthRequest, res: Response) {
    try {
      const rules = await RiskRule.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, rules, 'Risk rules retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateRiskRule(req: AuthRequest, res: Response) {
    try {
      const rule = await RiskRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!rule) return ApiResponse.error(res, 'Risk rule not found', 404);
      return ApiResponse.success(res, rule, 'Risk rule updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteRiskRule(req: AuthRequest, res: Response) {
    try {
      const rule = await RiskRule.findByIdAndDelete(req.params.id);
      if (!rule) return ApiResponse.error(res, 'Risk rule not found', 404);
      return ApiResponse.success(res, null, 'Risk rule deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // System Settings Management
  static async getSystemSettings(req: AuthRequest, res: Response) {
    try {
      const { configService } = await import('../services/config.service.js');

      const settings = {
        general: {
          companyName: await configService.get('COMPANY_NAME', 'VTPay Systems'),
          supportEmail: await configService.get('SUPPORT_EMAIL', 'support@vtpay.com'),
          timezone: await configService.get('TIMEZONE', 'Africa/Lagos'),
          currency: await configService.get('CURRENCY', 'NGN'),
          maintenanceMode: (await configService.get('MAINTENANCE_MODE', 'false')) === 'true',
        },
        notifications: {
          emailAlerts: (await configService.get('EMAIL_ALERTS', 'true')) === 'true',
          slackIntegration: (await configService.get('SLACK_INTEGRATION', 'false')) === 'true',
          webhookRetries: parseInt(await configService.get('WEBHOOK_RETRIES', '3')),
          dailyReports: (await configService.get('DAILY_REPORTS', 'true')) === 'true',
        },
        security: {
          twoFactorAuth: (await configService.get('TWO_FACTOR_AUTH', 'true')) === 'true',
          sessionTimeout: parseInt(await configService.get('SESSION_TIMEOUT', '30')),
          passwordExpiry: parseInt(await configService.get('PASSWORD_EXPIRY', '90')),
          ipWhitelist: await configService.get('IP_WHITELIST', ''),
        },
        integrations: {
          zainpay: {
            apiKey: await configService.get('ZAINPAY_API_KEY', ''),
            secretKey: await configService.get('ZAINPAY_SECRET_KEY', ''),
            baseUrl: await configService.get('ZAINPAY_BASE_URL', 'https://api.zainpay.ng'),
            isLive: (await configService.get('ZAINPAY_IS_LIVE', 'false')) === 'true',
          }
        }
      };

      return ApiResponse.success(res, settings, 'System settings retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateSystemSettings(req: AuthRequest, res: Response) {
    try {
      const { configService } = await import('../services/config.service.js');
      const settings = req.body;
      console.log('Updating system settings:', JSON.stringify(settings, null, 2));

      if (settings.general) {
        if (settings.general.companyName !== undefined) {
          console.log('Setting COMPANY_NAME:', settings.general.companyName);
          await configService.set('COMPANY_NAME', settings.general.companyName);
        }
        if (settings.general.supportEmail !== undefined) await configService.set('SUPPORT_EMAIL', settings.general.supportEmail);
        if (settings.general.timezone !== undefined) await configService.set('TIMEZONE', settings.general.timezone);
        if (settings.general.currency !== undefined) await configService.set('CURRENCY', settings.general.currency);
        if (settings.general.maintenanceMode !== undefined) await configService.set('MAINTENANCE_MODE', String(settings.general.maintenanceMode));
      }

      if (settings.notifications) {
        if (settings.notifications.emailAlerts !== undefined) await configService.set('EMAIL_ALERTS', String(settings.notifications.emailAlerts));
        if (settings.notifications.slackIntegration !== undefined) await configService.set('SLACK_INTEGRATION', String(settings.notifications.slackIntegration));
        if (settings.notifications.webhookRetries !== undefined) await configService.set('WEBHOOK_RETRIES', String(settings.notifications.webhookRetries));
        if (settings.notifications.dailyReports !== undefined) await configService.set('DAILY_REPORTS', String(settings.notifications.dailyReports));
      }

      if (settings.security) {
        if (settings.security.twoFactorAuth !== undefined) await configService.set('TWO_FACTOR_AUTH', String(settings.security.twoFactorAuth));
        if (settings.security.sessionTimeout !== undefined) await configService.set('SESSION_TIMEOUT', String(settings.security.sessionTimeout));
        if (settings.security.passwordExpiry !== undefined) await configService.set('PASSWORD_EXPIRY', String(settings.security.passwordExpiry));
        if (settings.security.ipWhitelist !== undefined) await configService.set('IP_WHITELIST', settings.security.ipWhitelist);
      }

      if (settings.integrations && settings.integrations.zainpay) {
        const zp = settings.integrations.zainpay;
        console.log('Setting Zainpay config:', zp);
        if (zp.apiKey !== undefined) await configService.set('ZAINPAY_API_KEY', zp.apiKey);
        if (zp.secretKey !== undefined) await configService.set('ZAINPAY_SECRET_KEY', zp.secretKey);
        if (zp.baseUrl !== undefined) await configService.set('ZAINPAY_BASE_URL', zp.baseUrl);
        if (zp.isLive !== undefined) await configService.set('ZAINPAY_IS_LIVE', String(zp.isLive));
      }

      console.log('System settings updated successfully');
      return ApiResponse.success(res, null, 'System settings updated successfully');
    } catch (error: any) {
      console.error('Error updating system settings:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }
}