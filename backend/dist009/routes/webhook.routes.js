import { Router } from 'express';
import { handleVTPayWebhook } from '../controllers/vtpay_webhook.controller.js';
import { handlePayrantWebhook } from '../controllers/payrant_webhook.controller.js';
const router = Router();
// Webhook endpoints - NO AUTH middleware here
router.post('/vtpay', handleVTPayWebhook);
router.post('/payrant', handlePayrantWebhook);
export default router;
