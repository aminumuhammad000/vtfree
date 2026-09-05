import express from 'express';
import * as SuperAdminController from '../controllers/super_admin.controller.js';
import { authenticateSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', SuperAdminController.login);

// Protected routes
router.use(authenticateSuperAdmin);
router.get('/users', SuperAdminController.getAllUsers);

// Pricing & Plans


router.get('/dashboard', SuperAdminController.getDashboardStats);
router.get('/transactions', SuperAdminController.getAllTransactions);
router.get('/payments', SuperAdminController.getAllPayments);
router.get('/wallets', SuperAdminController.getUserWallets);

// System Settings
router.get('/settings', SuperAdminController.getSystemSettings);
router.patch('/settings', SuperAdminController.updateSystemSettings);
router.get('/logs', SuperAdminController.getLogs);

// Tickets
router.get('/tickets', SuperAdminController.getAllTickets);
router.patch('/tickets/:id/status', SuperAdminController.updateTicketStatus);

export default router;
