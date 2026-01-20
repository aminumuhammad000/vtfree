import express from 'express';
import * as VTfreeAppController from '../controllers/vtfree_app.controller.js';

const router = express.Router();

// Public app details route
router.get('/apps/:appId', VTfreeAppController.getPublicAppDetails);

export default router;
