import express from 'express';
import { login, getDashboardStats, getAllUsers, getAllApps, getAllTransactions, getAllPayments, updateProfile } from '../controllers/super_admin.controller.js';
import { authenticateSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.use(authenticateSuperAdmin); // This line is kept as per the user's provided snippet, though the individual routes also specify `protectSuperAdmin`

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/apps', getAllApps);
router.get('/transactions', getAllTransactions);
router.get('/payments', getAllPayments);
router.put('/profile', updateProfile);

// System Settings
router.get('/settings', SuperAdminController.getSystemSettings);
router.patch('/settings', SuperAdminController.updateSystemSettings);

export default router;
