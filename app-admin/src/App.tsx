import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AuditLogs from './pages/AuditLogs';
import Dashboard from './pages/Dashboard';
import Funding from './pages/Funding';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import PricingPlans from './pages/PricingPlans';
import Profile from './pages/Profile';
import Providers from './pages/Providers';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import WalletCredit from './pages/WalletCredit';

<<<<<<< HEAD
import { Toaster } from 'react-hot-toast';

=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/funding" element={<Funding />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/wallet-credit" element={<WalletCredit />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
