import express from 'express';
import * as VTfreeAuthController from '../controllers/vtfree_auth.controller.js';
import { authenticateVTfreeUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', VTfreeAuthController.register);
router.post('/login', VTfreeAuthController.login);

// Protected routes
router.get('/profile', authenticateVTfreeUser, VTfreeAuthController.getProfile);

export default router;
