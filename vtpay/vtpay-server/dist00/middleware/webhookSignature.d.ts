import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to verify Zainpay webhook signature
 */
export declare const verifyWebhookSignature: (req: Request, res: Response, next: NextFunction) => void;
export default verifyWebhookSignature;
//# sourceMappingURL=webhookSignature.d.ts.map