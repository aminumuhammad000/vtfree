import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

const MainLayout = ({ children }: React.PropsWithChildren) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area with left margin to account for fixed sidebar */}
      <div className="lg:ml-64 min-h-screen">
        {/* Topbar */}
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Main Content with proper padding */}
        <main className="p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
