import express from 'express';
import * as SuperAdminController from '../controllers/super_admin.controller.js';
import { authenticateSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', SuperAdminController.login);

// Protected routes
router.use(authenticateSuperAdmin);
router.get('/apps', SuperAdminController.getAllApps);
router.get('/users', SuperAdminController.getAllUsers);
router.get('/owners', SuperAdminController.getAllOwners);
router.get('/owners/:id', SuperAdminController.getOwnerById);
router.get('/admins', SuperAdminController.getAllAdmins);
router.get('/admins/:id', SuperAdminController.getAdminById);

// Pricing & Plans
router.get('/pricing/ibdata-plans', SuperAdminController.getIBDataPlans);
router.post('/pricing/update-profit', SuperAdminController.updatePlanProfit);
router.post('/pricing/sync-ibdata', SuperAdminController.syncIBDataPlans);
router.get('/pricing/ibdata-balance', SuperAdminController.getIBDataBalance);

router.patch('/owners/:id/status', SuperAdminController.updateOwnerStatus);
router.patch('/admins/:id/status', SuperAdminController.updateAdminStatus);

router.get('/dashboard', SuperAdminController.getDashboardStats);
router.get('/transactions', SuperAdminController.getAllTransactions);
router.get('/payments', SuperAdminController.getAllPayments);
router.get('/wallets', SuperAdminController.getUserWallets);
router.get('/withdrawals', SuperAdminController.getAllWithdrawals);
router.patch('/withdrawals/:id/status', SuperAdminController.updateWithdrawalStatus);

// Plans
router.get('/plans', SuperAdminController.getAllPlans);
router.post('/plans', SuperAdminController.createPlan);
router.patch('/plans/:id', SuperAdminController.updatePlan);
router.delete('/plans/:id', SuperAdminController.deletePlan);

// Features
router.get('/features', SuperAdminController.getAllFeatures);
router.post('/features', SuperAdminController.createFeature);
router.patch('/features/:id', SuperAdminController.updateFeature);
router.delete('/features/:id', SuperAdminController.deleteFeature);

// System Settings
router.get('/settings', SuperAdminController.getSystemSettings);
router.patch('/settings', SuperAdminController.updateSystemSettings);
router.get('/logs', SuperAdminController.getLogs);

// VTPay Management
router.get('/vtpay/settings', SuperAdminController.getVTPaySettings);
router.post('/vtpay/settings', SuperAdminController.updateVTPaySettings);
router.get('/vtpay/balance', SuperAdminController.getVTPayPlatformBalance);
router.get('/vtpay/accounts', SuperAdminController.getVTPayAccounts);
router.post('/vtpay/accounts', SuperAdminController.createVTPayAccount);
router.get('/vtpay/accounts/:accountNumber/balance', SuperAdminController.getVTPayAccountBalance);
router.get('/vtpay/accounts/:accountNumber/transactions', SuperAdminController.getVTPayAccountTransactions);

// Tickets
router.get('/tickets', SuperAdminController.getAllTickets);
router.patch('/tickets/:id/status', SuperAdminController.updateTicketStatus);

export default router;
