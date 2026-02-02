import { Router } from 'express';
import { handleVTPayWebhook } from '../controllers/vtpay_webhook.controller.js';

const router = Router();

// Webhook endpoint - NO AUTH middleware here
router.post('/vtpay', handleVTPayWebhook);

export default router;
