// routes/payment.routes.ts
import { Request, Response, Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import virtualAccountRouter from './virtualAccount.routes.js';

const router = Router();

// Mount Virtual Account routes under /payment/virtual-account
router.use('/virtual-account', virtualAccountRouter);

/**
 * @route   POST /api/payment/virtual-account
 * @desc    Create or get user's virtual account
 * @access  Private
 */
router.post('/virtual-account', authenticate, PaymentController.createVirtualAccount);

/**
 * @route   GET /api/payment/virtual-account
 * @desc    Get user's virtual account details
 * @access  Private
 */
router.get('/virtual-account', authenticate, PaymentController.getVirtualAccount);

/**
 * @route   DELETE /api/payment/virtual-account
 * @desc    Deactivate user's virtual account
 * @access  Private
 */
router.delete('/virtual-account', authenticate, PaymentController.deactivateVirtualAccount);

/**
 * @route   POST /api/payment/initiate
 * @desc    Initialize payment for wallet funding (Monnify or Paystack)
 * @access  Private
 * @body    { 
 *   amount: number, 
 *   gateway?: 'monnify' | 'paystack',
 *   email?: string (required for Paystack)
 * }
 */
router.post('/initiate', authenticate, PaymentController.initiatePayment);

/**
 * @route   GET /api/payment/verify/:reference
 * @desc    Verify payment status (works for all supported gateways)
 * @access  Private
 */
router.get('/verify/:reference', authenticate, PaymentController.verifyPayment);


/**
 * @route   GET /api/payment/banks
 * @desc    Get list of supported banks (for bank transfers)
 * @access  Private
 */
router.get('/banks', authenticate, PaymentController.getBanks);

export default router;
