import express from 'express';
import * as VTfreeAppController from '../controllers/vtfree_app.controller.js';
import { authenticateVTfreeUser } from '../middleware/auth.middleware.js';
import { logoUpload } from '../middleware/upload.middleware.js';
const router = express.Router();
// Public routes
router.get('/public/:appId', VTfreeAppController.getPublicAppDetails);
// All routes require authentication
router.use(authenticateVTfreeUser);
router.post('/create', VTfreeAppController.createApp);
router.post('/verify-payment', VTfreeAppController.verifyAppPayment);
router.get('/my-apps', VTfreeAppController.getMyApps);
router.get('/prices', VTfreeAppController.getAppPrices);
router.get('/:appId', VTfreeAppController.getAppDetails);
// Source Code Download
router.get('/:appId/download', VTfreeAppController.downloadAppSource);
// APK Build & Download
router.post('/:appId/build', VTfreeAppController.triggerBuildApk);
router.get('/:appId/apk', VTfreeAppController.downloadApk); // Legacy
router.get('/:appId/download/:target', VTfreeAppController.downloadArtifact); // New Proxy
router.get('/:appId/status', VTfreeAppController.getAppBuildStatus);
router.post('/:appId/pay-and-build', VTfreeAppController.payAndStartBuild);
// Update App
router.put('/:appId', VTfreeAppController.updateAppDetails);
router.post('/:appId/admins', VTfreeAppController.addAppAdmin);
router.post('/:appId/upgrade', VTfreeAppController.upgradeApp);
router.delete('/:appId', VTfreeAppController.deleteApp);
// Logo Upload
router.post('/logo/upload', logoUpload.single('logo'), VTfreeAppController.uploadLogo);
export default router;
