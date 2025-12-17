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

// Communications route added
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/communications" element={<Layout><CommunicationsPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/tenants" element={<Layout><TenantsPage /></Layout>} />
        <Route path="/zainbox" element={<Layout><ZainboxPage /></Layout>} />
        <Route path="/transactions" element={<Layout><TransactionsPage /></Layout>} />
        <Route path="/settlements" element={<Layout><SettlementsPage /></Layout>} />
        <Route path="/webhooks" element={<Layout><WebhooksPage /></Layout>} />
        <Route path="/api-keys" element={<Layout><ApiKeysPage /></Layout>} />
        <Route path="/fees" element={<Layout><FeesPage /></Layout>} />
        <Route path="/risk" element={<Layout><RiskPage /></Layout>} />

        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
