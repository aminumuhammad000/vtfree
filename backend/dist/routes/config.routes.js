import express from 'express';
import { createConfig, deleteConfig, getAllConfigs, updateConfig } from '../controllers/config.controller.js';
import { authorize, authMiddleware as protect } from '../middleware/auth.middleware.js';
const router = express.Router();
// All routes are protected and require admin role
router.use(protect);
router.use(authorize(['admin', 'super_admin']));
router.get('/', getAllConfigs);
router.post('/', createConfig);
router.put('/:key', updateConfig);
router.delete('/:key', deleteConfig);
export default router;
