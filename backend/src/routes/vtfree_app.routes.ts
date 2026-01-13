import express from 'express';
import * as VTfreeAppController from '../controllers/vtfree_app.controller.js';
import { authenticateVTfreeUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateVTfreeUser);

router.post('/create', VTfreeAppController.createApp);
router.post('/verify-payment', VTfreeAppController.verifyAppPayment);
router.get('/my-apps', VTfreeAppController.getMyApps);
router.get('/:appId', VTfreeAppController.getAppDetails);

export default router;
