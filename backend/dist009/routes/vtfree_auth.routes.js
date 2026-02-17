import express from 'express';
import * as VTfreeAuthController from '../controllers/vtfree_auth.controller.js';
import { authenticateVTfreeUser } from '../middleware/auth.middleware.js';
const router = express.Router();
// Public routes
router.post('/register', VTfreeAuthController.register);
router.post('/login', VTfreeAuthController.login);
router.post('/forgot-password', VTfreeAuthController.forgotPassword);
router.post('/reset-password', VTfreeAuthController.resetPassword);
// Protected routes
router.use(authenticateVTfreeUser);
router.get('/profile', VTfreeAuthController.getProfile);
router.put('/profile', VTfreeAuthController.updateProfile);
router.post('/create-virtual-account', VTfreeAuthController.createVirtualAccount);
import { profilePictureUpload } from '../middleware/upload.middleware.js';
router.post('/profile/upload', profilePictureUpload.single('image'), VTfreeAuthController.uploadProfilePicture);
export default router;
