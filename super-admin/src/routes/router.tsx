/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import Splash from 'components/loader/Splash';
import PageLoader from 'components/loader/PageLoader';
import paths, { rootPaths } from './paths';
import ProtectedRoute from './ProtectedRoute';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard'));
const Apps = lazy(() => import('pages/apps'));
const Users = lazy(() => import('pages/users'));
const Transactions = lazy(() => import('pages/transactions'));
const Payments = lazy(() => import('pages/payments'));
const Settings = lazy(() => import('pages/settings'));
const Profile = lazy(() => import('pages/profile'));

// Customer Management
const AllCustomers = lazy(() => import('pages/customers/AllCustomers'));
const CustomersByApp = lazy(() => import('pages/customers/CustomersByApp'));
const CustomersByUser = lazy(() => import('pages/customers/CustomersByUser'));

// Finance
const PlatformWallet = lazy(() => import('pages/finance/PlatformWallet'));
const UserWallets = lazy(() => import('pages/finance/UserWallets'));
const Withdrawals = lazy(() => import('pages/finance/Withdrawals'));
const RevenueAnalytics = lazy(() => import('pages/finance/RevenueAnalytics'));

// Pricing
const PricingPlans = lazy(() => import('pages/pricing'));

// Messaging
const NotificationManagement = lazy(() => import('pages/messaging/NotificationManagement'));
const Broadcasts = lazy(() => import('pages/messaging/Broadcasts'));

// Logs
const AuditLogs = lazy(() => import('pages/logs/AuditLogs'));
const ApiLogs = lazy(() => import('pages/logs/ApiLogs'));
const ErrorLogs = lazy(() => import('pages/logs/ErrorLogs'));
const SecurityLogs = lazy(() => import('pages/logs/SecurityLogs'));

// Support & Providers
const Support = lazy(() => import('pages/support'));
const Providers = lazy(() => import('pages/providers'));

const SignIn = lazy(() => import('pages/authentication/SignIn'));
const ResetPassword = lazy(() => import('pages/authentication/ResetPassword'));
const Error404 = lazy(() => import('pages/errors/Error404'));

const routes = [
  {
    element: (
      <Suspense fallback={<Splash />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: (
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </MainLayout>
            ),
            children: [
              {
                index: true,
                element: <Dashboard />,
              },
              {
                path: paths.apps,
                element: <Apps />,
              },
              {
                path: paths.users,
                element: <Users />,
              },
              {
                path: paths.transactions,
                element: <Transactions />,
              },
              {
                path: paths.payments,
                element: <Payments />,
              },
              // Customer Management
              {
                path: paths.customersAll,
                element: <AllCustomers />,
              },
              {
                path: paths.customersByApp,
                element: <CustomersByApp />,
              },
              {
                path: paths.customersByUser,
                element: <CustomersByUser />,
              },
              // Finance
              {
                path: paths.platformWallet,
                element: <PlatformWallet />,
              },
              {
                path: paths.userWallets,
                element: <UserWallets />,
              },
              {
                path: paths.withdrawals,
                element: <Withdrawals />,
              },
              {
                path: paths.revenueAnalytics,
                element: <RevenueAnalytics />,
              },
              // Pricing
              {
                path: paths.pricing,
                element: <PricingPlans />,
              },
              // Messaging
              {
                path: paths.notifications,
                element: <NotificationManagement />,
              },
              {
                path: paths.broadcasts,
                element: <Broadcasts />,
              },
              // Logs
              {
                path: paths.auditLogs,
                element: <AuditLogs />,
              },
              {
                path: paths.apiLogs,
                element: <ApiLogs />,
              },
              {
                path: paths.errorLogs,
                element: <ErrorLogs />,
              },
              {
                path: paths.securityLogs,
                element: <SecurityLogs />,
              },
              // Support & Providers
              {
                path: paths.support,
                element: <Support />,
              },
              {
                path: paths.providers,
                element: <Providers />,
              },
              {
                path: paths.settings,
                element: <Settings />,
              },
              {
                path: paths.profile,
                element: <Profile />,
              },
            ],
          },
        ],
      },
      {
        path: rootPaths.authRoot,
        element: (
          <Suspense fallback={<Splash />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          {
            path: paths.signin,
            element: (
              <AuthLayout>
                <SignIn />
              </AuthLayout>
            ),
          },

          {
            path: paths.resetPassword,
            element: <ResetPassword />,
          },
        ],
      },
      {
        path: '*',
        element: <Error404 />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
