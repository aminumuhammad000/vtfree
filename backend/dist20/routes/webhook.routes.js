import { Router } from 'express';
import { handleVTStackWebhook } from '../controllers/vtstack_webhook.controller.js';
import { handlePayrantWebhook } from '../controllers/payrant_webhook.controller.js';
const router = Router();
// Webhook endpoints - NO AUTH middleware here
router.post('/vtstack', handleVTStackWebhook);
router.post('/payrant', handlePayrantWebhook);
// Support app-specific webhook endpoints (e.g., /dadsub/vtstack, /dadsub)
router.post('/:appId/vtstack', handleVTStackWebhook);
router.post('/:appId/payrant', handlePayrantWebhook);
router.post('/:appId', handleVTStackWebhook); // Default to VTStack if just /dadsub is pushed
export default router;
