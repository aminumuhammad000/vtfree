// routes/index.ts - Add this to your existing routes
import { Express, Request, Response } from 'express';
import billPaymentRoutes from './billpayment.routes.js';

export { default as authRoutes } from './auth.routes.js';
export { default as usersRoutes } from './users.routes.js';
export { default as transactionsRoutes } from './transactions.routes.js';
export { default as adminRoutes } from './admin.routes.js';
export { default as notificationsRoutes } from './notifications.routes.js';
export { default as promotionsRoutes } from './promotions.routes.js';
export { default as supportRoutes } from './support.routes.js';
export { default as walletRoutes } from './wallet.routes.js';
export { default as appAdminRoutes } from './app_admin.routes.js';
export { default as superAdminRoutes } from './super_admin.routes.js';
export { default as vtfreeAppRoutes } from './vtfree_app.routes.js';
export { default as vtfreeAuthRoutes } from './vtfree_auth.routes.js';
export { default as vtfreeWalletRoutes } from './vtfree_wallet.routes.js';

import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import walletRoutes from './wallet.routes.js';
import transactionsRoutes from './transactions.routes.js';
import notificationsRoutes from './notifications.routes.js';
import promotionsRoutes from './promotions.routes.js';
import supportRoutes from './support.routes.js';
import adminRoutes from './admin.routes.js';
import appAdminRoutes from './app_admin.routes.js';
import superAdminRoutes from './super_admin.routes.js';
import vtfreeAppRoutes from './vtfree_app.routes.js';
import vtfreeAuthRoutes from './vtfree_auth.routes.js';
import vtfreeWalletRoutes from './vtfree_wallet.routes.js';
import vtstackRoutes from './vtstack.routes.js';
import webhookRoutes from './webhook.routes.js';

export default (app: Express) => {
  // ... your existing routes

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/transactions', transactionsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/promotions', promotionsRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // New routes
  app.use('/api/v1/app-admin', appAdminRoutes);
  app.use('/api/v1/super-admin', superAdminRoutes);
  app.use('/api/v1/vtfree-app', vtfreeAppRoutes);
  app.use('/api/v1/vtfree-auth', vtfreeAuthRoutes);

  // VTFree Wallet Routes (matches frontend: /vtfree/wallet -> /api/v1/vtfree/wallet)
  app.use('/api/v1/vtfree/wallet', vtfreeWalletRoutes);

  // Bill payment routes
  app.use('/api/v1/billpayment', billPaymentRoutes);

  // VTStack routes
  app.use('/api/v1/vtstack', vtstackRoutes);

  // Webhooks - Open endpoints
  app.use('/api/v1/webhooks', webhookRoutes);

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });
};
