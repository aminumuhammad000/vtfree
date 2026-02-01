import { Router } from 'express';
import { body } from 'express-validator';
import { createVirtualAccount, getVirtualAccounts, getAccountBalance, getTransactions } from '../controllers/vtpay.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
// Apply authentication middleware to all routes
router.use(authenticate);
// Create virtual account
router.post('/virtual-accounts', [
    body('bankType').notEmpty().withMessage('Bank type is required'),
    body('accountName').notEmpty().withMessage('Account name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('reference').notEmpty().withMessage('Reference is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
], createVirtualAccount);
// Get all virtual accounts
router.get('/virtual-accounts', getVirtualAccounts);
// Get account balance
router.get('/virtual-accounts/:accountNumber/balance', getAccountBalance);
// Get transactions
router.get('/virtual-accounts/:accountNumber/transactions', getTransactions);
export default router;
