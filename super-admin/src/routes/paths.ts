export const rootPaths = {
  root: '/',
  pagesRoot: 'pages',
  authRoot: 'authentication',
  errorRoot: 'error',
};

export default {
  dashboard: rootPaths.root,
  apps: `/${rootPaths.pagesRoot}/apps`,
  users: `/${rootPaths.pagesRoot}/users`,
  transactions: `/${rootPaths.pagesRoot}/transactions`,
  payments: `/${rootPaths.pagesRoot}/payments`,



  // Finance & Wallet
  platformWallet: `/${rootPaths.pagesRoot}/finance/platform`,
  userWallets: `/${rootPaths.pagesRoot}/finance/wallets`,
  withdrawals: `/${rootPaths.pagesRoot}/finance/withdrawals`,
  revenueAnalytics: `/${rootPaths.pagesRoot}/finance/analytics`,
  transfers: `/${rootPaths.pagesRoot}/finance/transfers`,
  settlements: `/${rootPaths.pagesRoot}/finance/settlements`,

  // Pricing
  pricing: `/${rootPaths.pagesRoot}/pricing`,

  // Providers
  providers: `/${rootPaths.pagesRoot}/providers`,

  // Messaging
  notifications: `/${rootPaths.pagesRoot}/messaging/notifications`,

  // Logs
  logs: `/${rootPaths.pagesRoot}/logs`,

  // Support
  support: `/${rootPaths.pagesRoot}/support`,

  // Settings & Profile
  settings: `/${rootPaths.pagesRoot}/settings`,
  profile: `/${rootPaths.pagesRoot}/profile`,

  // Auth
  signin: `/${rootPaths.authRoot}/sign-in`,
  signup: `/${rootPaths.authRoot}/sign-up`,
  resetPassword: `/${rootPaths.authRoot}/reset-password`,
  404: `/${rootPaths.errorRoot}/404`,
};

