import express from 'express';
import * as AppAdminController from '../controllers/app_admin.controller.js';
import { authenticateAppAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', AppAdminController.login);

// Protected routes
router.get('/dashboard', authenticateAppAdmin, AppAdminController.getDashboardStats);

export default router;
