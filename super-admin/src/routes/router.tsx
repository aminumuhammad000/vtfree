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

// Finance
// Finance
const Finance = lazy(() => import('pages/finance'));

// Pricing
const PricingPlans = lazy(() => import('pages/pricing'));

// Messaging
const Notifications = lazy(() => import('pages/messaging/Notifications'));

// Logs
const LogsPage = lazy(() => import('pages/logs'));

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
              // Finance
              {
                path: paths.finance,
                element: <Finance />,
              },
              // Pricing
              {
                path: paths.pricing,
                element: <PricingPlans />,
              },
              // Messaging
              {
                path: paths.notifications,
                element: <Notifications />,
              },
              // Logs
              {
                path: paths.logs,
                element: <LogsPage />,
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
