import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { Register } from './components/Register';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CreateApp } from './components/CreateApp';
import { BuildStatus } from './components/BuildStatus';
import { AppDetails } from './components/AppDetails';
import { Support } from './components/Support';
import { Documentation } from './components/Documentation';
import { Settings } from './components/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('onboarding');
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>();

  const handleNavigate = (page: string, appId?: string) => {
    setCurrentPage(page);
    if (appId) {
      setSelectedAppId(appId);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding':
        return <Onboarding onNavigate={handleNavigate} />;
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'create-app':
        return <CreateApp onNavigate={handleNavigate} />;
      case 'build-status':
        return <BuildStatus onNavigate={handleNavigate} />;
      case 'app-details':
        return <AppDetails onNavigate={handleNavigate} appId={selectedAppId} />;
      case 'support':
        return <Support onNavigate={handleNavigate} />;
      case 'documentation':
        return <Documentation onNavigate={handleNavigate} />;
      case 'settings':
        return <Settings onNavigate={handleNavigate} />;
      default:
        return <Onboarding onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
