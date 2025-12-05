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
const Notifications = lazy(() => import('pages/notifications'));
const Help = lazy(() => import('pages/help'));
const SignIn = lazy(() => import('pages/authentication/SignIn'));
const SignUp = lazy(() => import('pages/authentication/SignUp'));
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
              {
                path: paths.settings,
                element: <Settings />,
              },
              {
                path: paths.profile,
                element: <Profile />,
              },
              {
                path: paths.notifications,
                element: <Notifications />,
              },
              {
                path: paths.help,
                element: <Help />,
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
            path: paths.signup,
            element: (
              <AuthLayout>
                <SignUp />
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

const router = createBrowserRouter(routes, { basename: '/base' });

export default router;
