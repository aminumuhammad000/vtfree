import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import PageLoader from 'components/loader/PageLoader';
import paths from './paths';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.signin} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
