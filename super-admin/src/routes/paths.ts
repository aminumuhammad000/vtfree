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
  finance: `/${rootPaths.pagesRoot}/finance`,



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
  help: `/${rootPaths.pagesRoot}/help`,
  404: `/${rootPaths.errorRoot}/404`,
};

