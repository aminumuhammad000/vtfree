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
router.get('/dashboard', SuperAdminController.getDashboardStats);
router.get('/transactions', SuperAdminController.getAllTransactions);
router.get('/payments', SuperAdminController.getAllPayments);
export default router;
