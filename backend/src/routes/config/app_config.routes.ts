import express from 'express';
import * as AppConfigController from '../../controllers/config/app_config.controller.js';
import { authenticateAppAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Routes for individual App Admins to manage their App's config
router.use(authenticateAppAdmin);

router.get('/', AppConfigController.getAppConfigs);
router.put('/', AppConfigController.updateAppConfig);

export default router;
