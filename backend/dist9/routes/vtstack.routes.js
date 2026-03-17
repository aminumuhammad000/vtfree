import { Router } from 'express';
import { createVirtualAccount, getVirtualAccounts, getAccountBalance, getTransactions } from '../controllers/funding_gateway.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
// Apply authentication middleware to all routes
router.use(authenticate);
// Create virtual account
router.post('/virtual-accounts', createVirtualAccount);
// Get all virtual accounts
router.get('/virtual-accounts', getVirtualAccounts);
// Get account balance
router.get('/virtual-accounts/:accountNumber/balance', getAccountBalance);
// Get transactions
router.get('/virtual-accounts/:accountNumber/transactions', getTransactions);
export default router;
