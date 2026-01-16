import express from 'express';
import * as AppConfigController from '../../controllers/config/app_config.controller.js';
import { authenticateAppAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Routes for individual App Admins to manage their App's config
router.use(authenticateAppAdmin);

router.get('/', AppConfigController.getAppConfigs);
<<<<<<< HEAD
router.put('/:key', AppConfigController.updateAppConfig);
=======
router.put('/', AppConfigController.updateAppConfig);
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf

export default router;
