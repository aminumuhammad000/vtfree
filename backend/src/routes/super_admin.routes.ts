import express from 'express';
import * as SuperAdminController from '../controllers/super_admin.controller.js';
import { authenticateSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', SuperAdminController.login);

// Protected routes
router.use(authenticateSuperAdmin);
router.get('/apps', SuperAdminController.getAllApps);
router.post('/apps', SuperAdminController.createApp);
router.get('/users', SuperAdminController.getAllUsers);
router.get('/owners', SuperAdminController.getAllOwners);
router.post('/owners', SuperAdminController.createOwner);
router.get('/owners/:id', SuperAdminController.getOwnerById);
router.put('/owners/:id', SuperAdminController.updateOwner);
router.delete('/owners/:id', SuperAdminController.deleteOwner);
router.get('/admins', SuperAdminController.getAllAdmins);
router.post('/admins', SuperAdminController.createAdmin);
router.get('/admins/:id', SuperAdminController.getAdminById);
router.put('/admins/:id', SuperAdminController.updateAdmin);
router.delete('/admins/:id', SuperAdminController.deleteAdmin);

// Pricing & Plans
router.get('/pricing/ibdata-plans', SuperAdminController.getIBDataPlans);
router.post('/pricing/update-profit', SuperAdminController.updatePlanProfit);
router.post('/pricing/sync-ibdata', SuperAdminController.syncIBDataPlans);
router.get('/pricing/ibdata-balance', SuperAdminController.getIBDataBalance);
router.get('/pricing/build-prices', SuperAdminController.getBuildPrices);
router.post('/pricing/build-price', SuperAdminController.updateBuildPrice);

router.patch('/owners/:id/status', SuperAdminController.updateOwnerStatus);
router.post('/owners/:id/credit', SuperAdminController.creditOwnerWallet);
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

// VTStack Management
router.get('/vtstack/settings', SuperAdminController.getVTStackSettings);
router.post('/vtstack/settings', SuperAdminController.updateVTStackSettings);
router.get('/vtstack/balance', SuperAdminController.getVTStackPlatformBalance);
router.get('/vtstack/accounts', SuperAdminController.getVTStackAccounts);
router.post('/vtstack/accounts', SuperAdminController.createVTStackAccount);
router.get('/vtstack/accounts/:accountNumber/balance', SuperAdminController.getVTStackAccountBalance);
router.get('/vtstack/accounts/:accountNumber/transactions', SuperAdminController.getVTStackAccountTransactions);

// Tickets
router.get('/tickets', SuperAdminController.getAllTickets);
router.patch('/tickets/:id/status', SuperAdminController.updateTicketStatus);

export default router;
