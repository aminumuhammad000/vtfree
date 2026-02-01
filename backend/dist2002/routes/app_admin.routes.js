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
router.get('/admins', authenticateAppAdmin, AppAdminController.getAllAdmins);
router.post('/admins', authenticateAppAdmin, AppAdminController.createAdmin);
// Audit Logs
router.get('/audit-logs', authenticateAppAdmin, AppAdminController.getAuditLogs);
router.delete('/audit-logs/:id', authenticateAppAdmin, AppAdminController.deleteAuditLog);
// Disputes
router.get('/disputes', authenticateAppAdmin, DisputeController.getDisputes);
router.get('/disputes/:id', authenticateAppAdmin, DisputeController.getDisputeById);
router.put('/disputes/:id/resolve', authenticateAppAdmin, DisputeController.resolveDispute);
router.post('/disputes', authenticateAppAdmin, DisputeController.createDispute); // For testing
// User Management (Filtered by App ID)
import { UserController } from '../controllers/user.controller.js';
router.get('/users', authenticateAppAdmin, UserController.getAllUsers);
router.get('/users/:id', authenticateAppAdmin, UserController.getUserById);
router.put('/users/:id', authenticateAppAdmin, UserController.updateUser);
router.put('/users/:id/status', authenticateAppAdmin, UserController.updateUser); // UserController.updateUser handles status
router.delete('/users/:id', authenticateAppAdmin, UserController.deleteUser);
router.post('/wallet/credit', authenticateAppAdmin, async (req, res) => {
    const { WalletController } = await import('../controllers/wallet.controller.js');
    return WalletController.creditWallet(req, res);
});
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
// System Config
import * as AppConfigController from '../controllers/config/app_config.controller.js';
router.get('/config', authenticateAppAdmin, AppConfigController.getAppConfigs);
router.put('/config/:key', authenticateAppAdmin, AppConfigController.updateAppConfig);
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
router.get('/providers/:id/env', authenticateAppAdmin, AppAdminProviderController.getEnv);
router.put('/providers/:id/env', authenticateAppAdmin, AppAdminProviderController.updateEnv);
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
router.post('/funding/virtual-account', authenticateAppAdmin, AppAdminFundingController.generateVirtualAccount);
router.get('/funding/ibdata-balance', authenticateAppAdmin, AppAdminFundingController.getIBDataBalance);
router.get('/funding/vtpay-accounts', authenticateAppAdmin, AppAdminFundingController.getVTPayAccounts);
// Payout & Payment Gateway (VTPay)
import { PayoutController } from '../controllers/payout.controller.js';
router.get('/payout/banks', authenticateAppAdmin, PayoutController.getBanksList);
router.post('/payout/validate-account', authenticateAppAdmin, PayoutController.validateAccount);
router.get('/payout/balance', authenticateAppAdmin, PayoutController.getVTPayBalance);
// Notifications & Broadcasts
import { NotificationController } from '../controllers/notification.controller.js';
router.post('/notifications/broadcast', authenticateAppAdmin, NotificationController.sendBroadcastNotification);
router.post('/notifications/email-broadcast', authenticateAppAdmin, NotificationController.sendBroadcastEmail);
// Support Messages
import { AppAdminSupportController } from '../controllers/app_admin_support.controller.js';
router.get('/support/messages', authenticateAppAdmin, AppAdminSupportController.getAllTickets);
router.get('/support/messages/:id', authenticateAppAdmin, AppAdminSupportController.getTicketById);
router.post('/support/messages/:id/reply', authenticateAppAdmin, AppAdminSupportController.replyToTicket);
router.patch('/support/messages/:id/status', authenticateAppAdmin, AppAdminSupportController.updateStatus);
export default router;
