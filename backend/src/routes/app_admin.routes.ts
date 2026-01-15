import express from 'express';
import * as AppAdminController from '../controllers/app_admin.controller.js';
import { DisputeController } from '../controllers/dispute.controller.js';
import { authenticateAppAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', AppAdminController.login);

// Protected routes
// Dashboard
router.get('/dashboard', authenticateAppAdmin, AppAdminController.getDashboardStats);
router.put('/profile', authenticateAppAdmin, AppAdminController.updateProfile);
router.put('/profile/password', authenticateAppAdmin, AppAdminController.changePassword);

// Disputes
router.get('/disputes', authenticateAppAdmin, DisputeController.getDisputes);
router.get('/disputes/:id', authenticateAppAdmin, DisputeController.getDisputeById);
router.put('/disputes/:id/resolve', authenticateAppAdmin, DisputeController.resolveDispute);
router.post('/disputes', authenticateAppAdmin, DisputeController.createDispute); // For testing

// User Management (Filtered by App ID)
import { UserController } from '../controllers/user.controller.js';
router.get('/users', authenticateAppAdmin, UserController.getAllUsers);
router.get('/users/:id', authenticateAppAdmin, UserController.getUserById);

// Transaction Management (Filtered by App ID)
import { TransactionController } from '../controllers/transaction.controller.js';
router.get('/transactions/all', authenticateAppAdmin, TransactionController.getAllTransactions);
router.get('/transactions/:id', authenticateAppAdmin, TransactionController.getTransactionById);

// Support Content
router.get('/support-content', authenticateAppAdmin, async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.getContent(req, res);
});
router.put('/support-content', authenticateAppAdmin, async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.updateContent(req, res);
});

// System Config (TODO: Filter by App ID or restrict access)
import configRoutes from './config.routes.js';
router.use('/config', configRoutes);

// Provider Management
import { AppAdminProviderController } from '../controllers/app_admin_provider.controller.js';
import { AppAdminFundingController } from '../controllers/app_admin_funding.controller.js';
router.get('/providers/balances', authenticateAppAdmin, AppAdminFundingController.getProviderBalances);
router.get('/providers', authenticateAppAdmin, AppAdminProviderController.list);
router.get('/providers/:id', authenticateAppAdmin, AppAdminProviderController.getById);
router.post('/providers', authenticateAppAdmin, AppAdminProviderController.create);
router.put('/providers/:id', authenticateAppAdmin, AppAdminProviderController.update);
router.delete('/providers/:id', authenticateAppAdmin, AppAdminProviderController.remove);
router.post('/providers/test/:code', authenticateAppAdmin, AppAdminProviderController.testConnection);
router.post('/providers/test-purchase/:code', authenticateAppAdmin, AppAdminProviderController.testPurchase);
router.get('/providers/data/:code', authenticateAppAdmin, AppAdminProviderController.getProviderData);

// Pricing Management
import { AppAdminPricingController } from '../controllers/app_admin_pricing.controller.js';
router.get('/pricing', authenticateAppAdmin, AppAdminPricingController.getAllPlans);
router.get('/pricing/:id', authenticateAppAdmin, AppAdminPricingController.getPlanById);
router.post('/pricing', authenticateAppAdmin, AppAdminPricingController.createPlan);
router.put('/pricing/:id', authenticateAppAdmin, AppAdminPricingController.updatePlan);
router.delete('/pricing/:id', authenticateAppAdmin, AppAdminPricingController.deletePlan);
router.post('/pricing/bulk-import', authenticateAppAdmin, AppAdminPricingController.bulkImportPlans);
router.get('/pricing/provider/:providerId', authenticateAppAdmin, AppAdminPricingController.getPlansByProvider);

// Funding & Provider Balances
router.get('/funding/info', authenticateAppAdmin, AppAdminFundingController.getFundingInfo);
router.get('/funding/accounts', authenticateAppAdmin, AppAdminFundingController.listAccounts);
router.post('/funding/accounts', authenticateAppAdmin, AppAdminFundingController.createAccount);
router.put('/funding/accounts/:id', authenticateAppAdmin, AppAdminFundingController.updateAccount);
router.delete('/funding/accounts/:id', authenticateAppAdmin, AppAdminFundingController.deleteAccount);

// Payout & Payment Gateway (VTPay/Payrant)
import { PayoutController } from '../controllers/payout.controller.js';
router.get('/payout/banks', authenticateAppAdmin, PayoutController.getBanksList);
router.post('/payout/validate-account', authenticateAppAdmin, PayoutController.validateAccount);
router.get('/payout/balance', authenticateAppAdmin, PayoutController.getVTPayBalance);

// Notifications & Broadcasts
import { NotificationController } from '../controllers/notification.controller.js';
router.post('/notifications/broadcast', authenticateAppAdmin, NotificationController.sendBroadcastNotification);
router.post('/notifications/email-broadcast', authenticateAppAdmin, NotificationController.sendBroadcastEmail);

export default router;
