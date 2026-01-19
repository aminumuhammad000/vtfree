import express from 'express';
import * as VTfreeWalletController from '../controllers/vtfree_wallet.controller.js';
import { authenticateVTfreeUser } from '../middleware/auth.middleware.js';
const router = express.Router();
router.use(authenticateVTfreeUser);
router.get('/', VTfreeWalletController.getWallet);
router.post('/fund', VTfreeWalletController.fundWallet); // Dev endpoint
export default router;
