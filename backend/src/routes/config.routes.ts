import express from 'express';
import { createConfig, deleteConfig, getAllConfigs, updateConfig } from '../controllers/config.controller.js';
import { authorize, authMiddleware as protect } from '../middleware/auth.middleware.js';
import { ApiResponse } from '../utils/response.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Allow super_admin, admin role, or app_admin type
router.use((req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return ApiResponse.error(res, 'Unauthorized', 401);

    if (user.type === 'super_admin' || user.type === 'app_admin' || ['admin', 'super_admin'].includes(user.role)) {
        return next();
    }

    return ApiResponse.error(res, 'Unauthorized access', 403);
});

router.get('/', getAllConfigs);
router.post('/', createConfig);
router.put('/:key', updateConfig); // The instruction "Use upsert in updateConfig controller" refers to the implementation of updateConfig in config.controller.js, not this file.
router.delete('/:key', deleteConfig);

export default router;
