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

export default router;
