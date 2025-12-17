import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import TenantsPage from './pages/tenants/TenantsPage';
import ZainboxPage from './pages/zainbox/ZainboxPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import WebhooksPage from './pages/webhooks/WebhooksPage';
import SettlementsPage from './pages/settlements/SettlementsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/tenants" element={<Layout><TenantsPage /></Layout>} />
        <Route path="/zainbox" element={<Layout><ZainboxPage /></Layout>} />
        <Route path="/transactions" element={<Layout><TransactionsPage /></Layout>} />
        <Route path="/transactions/deposits" element={<Layout><TransactionsPage /></Layout>} />
        <Route path="/transactions/transfers" element={<Layout><TransactionsPage /></Layout>} />
        <Route path="/transactions/dva" element={<Layout><TransactionsPage /></Layout>} />
        <Route path="/settlements" element={<Layout><SettlementsPage /></Layout>} />
        <Route path="/webhooks" element={<Layout><WebhooksPage /></Layout>} />
        <Route path="/api-keys" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">API & Key Management</h1><p className="text-slate-500 mt-2">Coming soon...</p></div></Layout>} />
        <Route path="/fees" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Fees & Revenue</h1><p className="text-slate-500 mt-2">Coming soon...</p></div></Layout>} />
        <Route path="/risk" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Risk & Compliance</h1><p className="text-slate-500 mt-2">Coming soon...</p></div></Layout>} />
        <Route path="/settings" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">System Settings</h1><p className="text-slate-500 mt-2">Coming soon...</p></div></Layout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
