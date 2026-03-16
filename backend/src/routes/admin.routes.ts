import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import AdminFundingController from '../controllers/admin_funding.controller.js';
import AdminPricingController from '../controllers/admin_pricing.controller.js';
import AdminProviderController from '../controllers/admin_provider.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import configRoutes from './config.routes.js';

const router = Router();

// System Config management
router.use('/config', configRoutes);

// Admin routes
router.post('/login', AdminController.login);
router.get('/dashboard', authMiddleware, AdminController.getDashboardStats);
// Admin profile
router.get('/profile', authMiddleware, AdminController.getProfile);
router.put('/profile', authMiddleware, AdminController.updateAdminProfile);
router.put('/profile/password', authMiddleware, AdminController.changeAdminPassword);

// Admin user management
router.post('/admins', authMiddleware, AdminController.createAdminUser);
router.get('/admins', authMiddleware, AdminController.getAllAdmins);

// User management
router.get('/tenants', authMiddleware, AdminController.getAllUsers);
router.get('/users', authMiddleware, AdminController.getAllUsers);
router.get('/users/:id', authMiddleware, AdminController.getUserById);
router.put('/users/:id/status', authMiddleware, AdminController.updateUserStatus);
router.put('/users/:id', authMiddleware, AdminController.updateUser);
router.delete('/users/:id', authMiddleware, AdminController.deleteUser);

// Wallet management
router.post('/wallet/credit', authMiddleware, AdminController.creditUserWallet);

// Audit logs
router.get('/audit-logs', authMiddleware, AdminController.getAuditLogs);
router.delete('/audit-logs/:id', authMiddleware, AdminController.deleteAuditLog);

// Pricing management
router.get('/pricing', authMiddleware, AdminPricingController.getAllPlans);
router.get('/pricing/provider/:providerId', authMiddleware, AdminPricingController.getPlansByProvider);
router.get('/pricing/:id', authMiddleware, AdminPricingController.getPlanById);
router.post('/pricing', authMiddleware, AdminPricingController.createPlan);
router.put('/pricing/:id', authMiddleware, AdminPricingController.updatePlan);
router.delete('/pricing/:id', authMiddleware, AdminPricingController.deletePlan);
router.post('/pricing/bulk-import', authMiddleware, AdminPricingController.bulkImportPlans);

// Provider balances (place BEFORE parameterized provider routes)
router.get('/providers/balances', authMiddleware, AdminFundingController.getProviderBalances);

// Provider testing routes (place BEFORE parameterized provider routes)
router.post('/providers/test/:code', authMiddleware, AdminProviderController.testConnection);
router.get('/providers/data/:code', authMiddleware, AdminProviderController.getProviderData);

// Provider management
router.get('/providers', authMiddleware, AdminProviderController.list);
router.get('/providers/:id', authMiddleware, AdminProviderController.getById);
router.post('/providers', authMiddleware, AdminProviderController.create);
router.put('/providers/:id', authMiddleware, AdminProviderController.update);
router.delete('/providers/:id', authMiddleware, AdminProviderController.remove);
router.get('/providers/:id/env', authMiddleware, AdminProviderController.getEnv);
router.put('/providers/:id/env', authMiddleware, AdminProviderController.updateEnv);

// Funding info
router.get('/funding/info', authMiddleware, AdminFundingController.getFundingInfo);
router.get('/funding/accounts', authMiddleware, AdminFundingController.listAccounts);
router.post('/funding/accounts', authMiddleware, AdminFundingController.createAccount);
router.put('/funding/accounts/:id', authMiddleware, AdminFundingController.updateAccount);
router.delete('/funding/accounts/:id', authMiddleware, AdminFundingController.deleteAccount);

// Support messages
router.get('/support/messages', authMiddleware, async (req, res, next) => {
    const { SupportController } = await import('../controllers/support.controller.js');
    return SupportController.getAllTickets(req, res);
});

// Support content management
router.get('/support-content', authMiddleware, async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.getContent(req, res);
});
router.put('/support-content', authMiddleware, async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.updateContent(req, res);
});

// Broadcast notifications
router.post('/notifications/broadcast', authMiddleware, async (req, res) => {
    const { NotificationController } = await import('../controllers/notification.controller.js');
    return NotificationController.sendBroadcastNotification(req, res);
});


// API Key Management
router.post('/api-keys', authMiddleware, AdminController.generateApiKey);
router.get('/api-keys', authMiddleware, AdminController.getApiKeys);
router.delete('/api-keys/:id', authMiddleware, AdminController.revokeApiKey);

// Fee Management
router.post('/fees', authMiddleware, AdminController.createFee);
router.get('/fees', authMiddleware, AdminController.getFees);
router.put('/fees/:id', authMiddleware, AdminController.updateFee);
router.delete('/fees/:id', authMiddleware, AdminController.deleteFee);

// Risk Rule Management
router.post('/risk-rules', authMiddleware, AdminController.createRiskRule);
router.get('/risk-rules', authMiddleware, AdminController.getRiskRules);
router.put('/risk-rules/:id', authMiddleware, AdminController.updateRiskRule);
router.delete('/risk-rules/:id', authMiddleware, AdminController.deleteRiskRule);

// System Settings
router.get('/settings', authMiddleware, AdminController.getSystemSettings);
router.patch('/settings', authMiddleware, AdminController.updateSystemSettings);

export default router;
