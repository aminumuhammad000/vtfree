import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import TenantsPage from './pages/tenants/TenantsPage';
import ZainboxPage from './pages/zainbox/ZainboxPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import WebhooksPage from './pages/webhooks/WebhooksPage';
import SettlementsPage from './pages/settlements/SettlementsPage';
import FeesPage from './pages/fees/FeesPage';
import RiskPage from './pages/risk/RiskPage';
import SettingsPage from './pages/settings/SettingsPage';
import ApiKeysPage from './pages/api-keys/ApiKeysPage';
import CommunicationsPage from './pages/communications/CommunicationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import HelpMessages from './pages/help/HelpMessages';
import AdminsPage from './pages/admins/AdminsPage';
import Login from './pages/auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">You do not have permission to access the admin portal.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/communications" element={<ProtectedRoute><Layout><CommunicationsPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><Layout><TenantsPage /></Layout></ProtectedRoute>} />
      <Route path="/zainbox" element={<ProtectedRoute><Layout><ZainboxPage /></Layout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Layout><TransactionsPage /></Layout></ProtectedRoute>} />
      <Route path="/settlements" element={<ProtectedRoute><Layout><SettlementsPage /></Layout></ProtectedRoute>} />
      <Route path="/webhooks" element={<ProtectedRoute><Layout><WebhooksPage /></Layout></ProtectedRoute>} />
      <Route path="/api-keys" element={<ProtectedRoute><Layout><ApiKeysPage /></Layout></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><Layout><FeesPage /></Layout></ProtectedRoute>} />
      <Route path="/risk" element={<ProtectedRoute><Layout><RiskPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><HelpMessages /></Layout></ProtectedRoute>} />
      <Route path="/admins" element={<ProtectedRoute><Layout><AdminsPage /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
