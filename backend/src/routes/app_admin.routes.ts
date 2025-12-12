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

export default router;
