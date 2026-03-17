// controllers/billpayment.controller.ts
import { NextFunction, Request, Response } from 'express';
import AirtimePlan from '../models/airtime_plan.model.js';
import { Transaction, User } from '../models/index.js';
import providerRegistry from '../services/providerRegistry.service.js';
import smeplugService from '../services/smeplug.service.js';
import { WalletService } from '../services/wallet.service.js';
import { AuthRequest } from '../types/index.js';
import { normalizeNetwork } from '../utils/network.js';
import { ApiResponse } from '../utils/response.js';

export class BillPaymentController {
  // Get networks
  async getNetworks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const app_id = req.user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('airtime', app_id);
      const client = selected?.client || smeplugService;
      const networks = await (client.getNetworks ? client.getNetworks() : smeplugService.getNetworks());
      const payload = (networks as any).response || networks;
      return ApiResponse.success(res, 'Networks retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get data plans
  async getDataPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { network } = req.query;
      const app_id = req.user?.app_id;

      // Optional filter by provider/network
      let providerId: number | undefined;
      if (network) {
        const normalized = normalizeNetwork(String(network));
        if (!normalized) {
          return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
        }
        providerId = normalized;
      }

      // Only fetch plans belonging to this app
      const filter: any = {
        app_id,
        type: 'DATA',
        active: true
      };
      if (providerId) filter.providerId = providerId;

      const dbPlans = await AirtimePlan.find(filter).sort({ providerId: 1, price: 1, name: 1 });

      const payload = dbPlans.map((p: any) => {
        let name = p.name || '';
        // Clean common technical labels from customer-facing plan names
        const cleanName = name
          .replace(/\(SME\)/gi, '')
          .replace(/\bSME\b/gi, '') // Word boundary to avoid matching substrings
          .replace(/\(CG\)/gi, '')
          .replace(/\bCG\b/gi, '')
          .replace(/\(Gifting\)/gi, '')
          .replace(/\bGifting\b/gi, '')
          .replace(/\(Corporate\)/gi, '')
          .replace(/\bCorporate\b/gi, '')
          .replace(/\(Direct\)/gi, '')
          .replace(/\bDirect\b/gi, '')
          .replace(/\b\d+\s*days?\b/gi, '') // Remove "30 days", "1 day"
          .replace(/\bweekly\b/gi, '')
          .replace(/\bmonthly\b/gi, '')
          .replace(/\bdaily\b/gi, '')
          .replace(/\bvalid for \d+ days?\b/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/\s-\s*$/, '') // Remove trailing " - "
          .trim();

        return {
          plan_id: String(p._id),
          network: String(p.providerId),
          plan_name: cleanName || name, // Fallback to original if cleaning empties it
          plan_type: 'DATA',
          validity: p.meta?.validity || '',
          price: Number(p.price),
          data_value: p.meta?.data_value || p.code || '',
          providerName: p.providerName,
        };
      });

      return ApiResponse.success(res, 'Data plans retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get cable providers
  async getCableProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const app_id = req.user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('cable', app_id);
      const client = selected?.client || smeplugService;
      const providers = await (client.getCableProviders ? client.getCableProviders() : smeplugService.getCableProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Cable providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get electricity providers
  async getElectricityProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const app_id = req.user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('electricity', app_id);
      const client = selected?.client || smeplugService;
      const providers = await (client.getElectricityProviders ? client.getElectricityProviders() : smeplugService.getElectricityProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Electricity providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get exam pin providers
  async getExamPinProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const app_id = req.user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('exampin', app_id);
      const client = selected?.client || smeplugService;
      const providers = await (client.getExamPinProviders ? client.getExamPinProviders() : smeplugService.getExamPinProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Exam pin providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Purchase airtime
  async purchaseAirtime(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { network, phone, amount, airtime_type = 'VTU', ported_number = true, pin } = req.body;
      const userId = req.user?.id;

      // Enforce transaction PIN and KYC
      const user = await User.findById(userId);
      if (!user) return ApiResponse.error(res, 'User not found', 404);

      if (user.kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required. Please complete your profile verification to perform transactions.',
          requiresKyc: true
        });
      }

      if (!pin || !/^\d{4}$/.test(String(pin))) {
        return ApiResponse.error(res, 'Valid 4-digit transaction PIN is required', 400);
      }
      if (!user.transaction_pin) {
        // Allow default PIN for legacy users without a stored PIN
        if (String(pin) !== '1234') {
          return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
        }
      } else {
        const pinOk = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.compare(String(pin), user.transaction_pin as string));
        if (!pinOk) {
          return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
        }
      }

      // Normalize network input to provider ID
      const providerId = normalizeNetwork(network);
      if (!providerId) {
        return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
      }

      // Validate user balance
      const wallet = await WalletService.getWalletByUserId(userId);
      if (wallet.balance < parseFloat(amount)) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = `AIR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Get wallet for wallet_id
      const walletData = await WalletService.getWalletByUserId(userId);

      // Deduct from wallet
      await WalletService.debit(userId, parseFloat(amount), 'Airtime purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        app_id: req.user?.app_id,
        user_id: userId,
        wallet_id: walletData._id,
        type: 'airtime_topup',
        amount: parseFloat(amount),
        total_charged: parseFloat(amount),
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        destination_account: phone,
        description: `Airtime purchase - ${network.toUpperCase()} - ${phone}`,
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('airtime', req.user?.app_id);
        const client = selected?.client || smeplugService;
        const result = await (client.purchaseAirtime
          ? client.purchaseAirtime({
            network: String(providerId),
            phone: String(phone),
            ref,
            airtime_type,
            ported_number,
            amount: String(amount),
          })
          : smeplugService.purchaseAirtime({
            network: String(providerId),
            phone: String(phone),
            ref,
            airtime_type,
            ported_number,
            amount: String(amount),
          }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });

          // Process referral bonus if this is user's first successful transaction
          const { ReferralService } = await import('../services/referral.service.js');
          await ReferralService.processFirstTransactionReferral(userId);

          return ApiResponse.success(res, 'Airtime purchase successful', {
            transaction,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, parseFloat(amount), 'Airtime purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          console.error('❌ Airtime purchase failed - Provider Response:', JSON.stringify(result, null, 2));
          return ApiResponse.error(res, `Airtime purchase failed: ${result.msg || 'Unknown error'}`, 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, parseFloat(amount), 'Airtime purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        console.error('❌ Airtime purchase error:', error.message, error.response?.data);
        // Throw a clean error object to avoid circular reference issues in global error handler
        throw new Error(error.response?.data?.message || error.message || 'Airtime purchase failed');
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase data
  async purchaseData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { network, phone, plan, ported_number = true, pin } = req.body;
      const userId = req.user?.id;

      // Enforce transaction PIN and KYC
      const user = await User.findById(userId);
      if (!user) return ApiResponse.error(res, 'User not found', 404);

      if (user.kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required. Please complete your profile verification to perform transactions.',
          requiresKyc: true
        });
      }

      if (!user.transaction_pin) {
        return ApiResponse.error(res, 'Please set your 4-digit transaction PIN before making purchases', 400);
      }
      if (!pin || !/^\d{4}$/.test(String(pin))) {
        return ApiResponse.error(res, 'Valid 4-digit transaction PIN is required', 400);
      }
      const pinOk = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.compare(String(pin), user.transaction_pin as string));
      if (!pinOk) {
        return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
      }

      // Normalize network input to provider ID
      const providerId = normalizeNetwork(network);
      if (!providerId) {
        return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
      }

      // Get plan details from DB
      let dbPlan;
      const mongoose = await import('mongoose').then(m => m.default || m);
      if (plan && typeof plan === 'string' && /^[0-9a-fA-F]{24}$/.test(plan)) {
        dbPlan = await AirtimePlan.findById(plan);
      }

      // Fallback search by externalPlanId or code if not found by _id
      if (!dbPlan) {
        dbPlan = await AirtimePlan.findOne({
          $or: [
            { externalPlanId: plan },
            { code: plan }
          ],
          app_id: req.user?.app_id
        });
      }
      if (!dbPlan) {
        return ApiResponse.error(res, 'Invalid plan selected', 400);
      }

      const amount = Number(dbPlan.price);

      // Validate user balance
      const wallet = await WalletService.getWalletByUserId(userId);
      if (wallet.balance < amount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = `DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Get wallet for wallet_id
      const walletData = await WalletService.getWalletByUserId(userId);

      // Deduct from wallet
      await WalletService.debit(userId, amount, 'Data purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        app_id: req.user?.app_id,
        user_id: userId,
        wallet_id: walletData._id,
        type: 'data_purchase',
        amount,
        total_charged: amount,
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        destination_account: phone,
        description: `Data purchase - ${network.toUpperCase()} - ${phone}`,
        plan_id: dbPlan._id
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('data', req.user?.app_id, dbPlan.source_provider);
        const client = selected?.client || smeplugService;
        const result = await (client.purchaseData
          ? client.purchaseData({
            network: String(providerId),
            phone: String(phone),
            ref,
            plan: String(dbPlan.externalPlanId || dbPlan.code),
            amount: Number(dbPlan.price),
            ported_number,
          })
          : smeplugService.purchaseData({
            network: String(providerId),
            phone: String(phone),
            ref,
            plan: String(dbPlan.externalPlanId || dbPlan.code),
            amount: Number(dbPlan.price),
            ported_number,
          }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });

          // Process referral bonus if this is user's first successful transaction
          const { ReferralService } = await import('../services/referral.service.js');
          await ReferralService.processFirstTransactionReferral(userId);

          return ApiResponse.success(res, 'Data purchase successful', {
            transaction,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Data purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          return ApiResponse.error(res, 'Data purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Data purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Verify cable account
  async verifyCableAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, iucnumber } = req.body;
      const app_id = (req as AuthRequest).user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('cable', app_id);
      const client = selected?.client || smeplugService;
      const result = await (client.verifyCableAccount
        ? client.verifyCableAccount({ provider: String(provider), iucnumber: String(iucnumber) })
        : smeplugService.verifyCableAccount({ provider: String(provider), iucnumber: String(iucnumber) }));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Account verification successful', {
          customer_name: result.Customer_Name,
          iucnumber,
        });
      } else {
        return ApiResponse.error(res, 'Account verification failed', 400);
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase cable TV
  async purchaseCableTV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, iucnumber, plan, subtype = 'renew', phone } = req.body;
      const userId = req.user?.id;
      const user = await User.findById(userId);
      if (user?.kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required. Please complete your profile verification to perform transactions.',
          requiresKyc: true
        });
      }

      // Get plan details (Note: SMEPlug and others might have different ways to fetch plans, normally from DB)
      const plansArray = await smeplugService.getCableTVPlans();
      const plans = (plansArray as any).response || plansArray;
      const selectedPlan = plans?.find((p: any) => p.id === plan);

      if (!selectedPlan) {
        return ApiResponse.error(res, 'Invalid plan selected', 400);
      }

      const amount = parseFloat(selectedPlan.price);

      // Validate user balance
      const wallet = await WalletService.getWalletByUserId(userId);
      if (wallet.balance < amount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = `CABLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Deduct from wallet
      await WalletService.debit(userId, amount, 'Cable TV purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        app_id: req.user?.app_id,
        user_id: userId,
        type: 'cable',
        amount,
        reference: ref,
        status: 'pending',
        metadata: { provider, iucnumber, plan: selectedPlan, subtype },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('cable', req.user?.app_id);
        const client = selected?.client || smeplugService;
        const result = await (client.purchaseCableTV
          ? client.purchaseCableTV({ provider, iucnumber, plan, ref, subtype, phone })
          : smeplugService.purchaseCableTV({ provider, iucnumber, plan, ref, subtype, phone }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'completed',
            response: result
          });
          return ApiResponse.success(res, 'Cable TV purchase successful', {
            transaction,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Cable TV purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            response: result
          });
          return ApiResponse.error(res, 'Cable TV purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Cable TV purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          response: { error: error.message }
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Verify electricity meter
  async verifyElectricityMeter(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, meternumber, metertype } = req.body;
      const app_id = (req as AuthRequest).user?.app_id;
      const selected = await providerRegistry.getPreferredProviderFor('electricity', app_id);
      const client = selected?.client || smeplugService;
      const result = await (client.verifyElectricityMeter
        ? client.verifyElectricityMeter({ provider, meternumber, metertype })
        : smeplugService.verifyElectricityMeter({ provider, meternumber, metertype }));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Meter verification successful', {
          customer_name: result.Customer_Name,
          meternumber,
        });
      } else {
        return ApiResponse.error(res, 'Meter verification failed', 400);
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase electricity
  async purchaseElectricity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, meternumber, amount, metertype, phone } = req.body;
      const userId = req.user?.id;
      const user = await User.findById(userId);
      if (user?.kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required. Please complete your profile verification to perform transactions.',
          requiresKyc: true
        });
      }

      // Validate user balance
      const wallet = await WalletService.getWalletByUserId(userId);
      if (wallet.balance < parseFloat(amount)) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = `ELEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Deduct from wallet
      await WalletService.debit(userId, parseFloat(amount), 'Electricity purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        app_id: req.user?.app_id,
        user_id: userId,
        type: 'electricity',
        amount: parseFloat(amount),
        reference: ref,
        status: 'pending',
        metadata: { provider, meternumber, metertype },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('electricity', req.user?.app_id);
        const client = selected?.client || smeplugService;
        const result = await (client.purchaseElectricity
          ? client.purchaseElectricity({ provider, meternumber, amount, metertype, phone, ref })
          : smeplugService.purchaseElectricity({ provider, meternumber, amount, metertype, phone, ref }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'completed',
            response: result
          });
          return ApiResponse.success(res, 'Electricity purchase successful', {
            transaction,
            token: result.token,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, parseFloat(amount), 'Electricity purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            response: result
          });
          return ApiResponse.error(res, 'Electricity purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, parseFloat(amount), 'Electricity purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          response: { error: error.message }
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase exam pin
  async purchaseExamPin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, quantity } = req.body;
      const userId = req.user?.id;
      const user = await User.findById(userId);
      if (user?.kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required. Please complete your profile verification to perform transactions.',
          requiresKyc: true
        });
      }

      // Get provider details
      const providersArray = await smeplugService.getExamPinProviders();
      const providers = (providersArray as any).response || providersArray;
      const selectedProvider = providers?.find((p: any) => p.id === provider);

      if (!selectedProvider) {
        return ApiResponse.error(res, 'Invalid provider selected', 400);
      }

      const amount = parseFloat(selectedProvider.price) * parseInt(quantity);

      // Validate user balance
      const wallet = await WalletService.getWalletByUserId(userId);
      if (wallet.balance < amount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = `PIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Deduct from wallet
      await WalletService.debit(userId, amount, 'Exam pin purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        app_id: req.user?.app_id,
        user_id: userId,
        type: 'exampin',
        amount,
        reference: ref,
        status: 'pending',
        metadata: { provider: selectedProvider, quantity },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('exampin', req.user?.app_id);
        const client = selected?.client || smeplugService;
        const result = await (client.purchaseExamPin
          ? client.purchaseExamPin({ provider, quantity, ref })
          : smeplugService.purchaseExamPin({ provider, quantity, ref }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'completed',
            response: result
          });
          return ApiResponse.success(res, 'Exam pin purchase successful', {
            transaction,
            pins: result.pins || result.pin,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Exam pin purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            response: result
          });
          return ApiResponse.error(res, 'Exam pin purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Exam pin purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          response: { error: error.message }
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Get transaction status
  async getTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;
      const app_id = (req as AuthRequest).user?.app_id;

      const selected = await providerRegistry.getPreferredProviderFor('airtime', app_id);
      const client = selected?.client || smeplugService;
      const result = await (client.getTransactionStatus
        ? client.getTransactionStatus(reference)
        : smeplugService.getTransactionStatus(reference));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Transaction status retrieved', result.response);
      } else {
        return ApiResponse.error(res, 'Failed to retrieve transaction status', 400);
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new BillPaymentController();
