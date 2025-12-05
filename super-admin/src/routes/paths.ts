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
  settings: `/${rootPaths.pagesRoot}/settings`,
  profile: `/${rootPaths.pagesRoot}/profile`,
  notifications: `/${rootPaths.pagesRoot}/notifications`,
  help: `/${rootPaths.pagesRoot}/help`,
  signin: `/${rootPaths.authRoot}/sign-in`,
  signup: `/${rootPaths.authRoot}/sign-up`,
  resetPassword: `/${rootPaths.authRoot}/reset-password`,
  404: `/${rootPaths.errorRoot}/404`,
};
