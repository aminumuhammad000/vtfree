import { Router } from 'express';
import { handleVTStackWebhook } from '../controllers/vtstack_webhook.controller.js';
import { handlePayrantWebhook } from '../controllers/payrant_webhook.controller.js';
const router = Router();
// Webhook endpoints - NO AUTH middleware here
router.post('/vtstack', handleVTStackWebhook);
router.post('/payrant', handlePayrantWebhook);
export default router;
