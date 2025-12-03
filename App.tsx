import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './StoreContext';
import { ViewState } from './types';
import { Navbar } from './components/Navbar';
import { AdminModal } from './components/AdminModal';
import { Home } from './views/Home';
import { Themes } from './views/Themes';
import { ThemeDetails } from './views/ThemeDetails';
import { MyThemes } from './views/MyThemes';
import { Auth } from './views/Auth';
import { AIEditor } from './views/AIEditor';
import { AdminDashboard } from './views/AdminDashboard';
import { LivePreview } from './views/LivePreview';

const AppContent: React.FC = () => {
  const { currentView, selectedThemeId } = useStore();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Global Listener for Ctrl+6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '6') {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME: return <><Navbar /><Home /></>;
      case ViewState.THEMES: return <><Navbar /><Themes /></>;
      case ViewState.THEME_DETAILS: return <><Navbar /><ThemeDetails /></>;
      case ViewState.MY_THEMES: return <><Navbar /><MyThemes /></>;
      case ViewState.LOGIN: return <><Navbar /><Auth mode="LOGIN" /></>;
      case ViewState.SIGNUP: return <><Navbar /><Auth mode="SIGNUP" /></>;
      case ViewState.AI_EDITOR: return <AIEditor key={selectedThemeId} />; // No Navbar, key forces reset
      case ViewState.ADMIN_DASHBOARD: return <AdminDashboard />; // No Navbar
      case ViewState.LIVE_PREVIEW: return <LivePreview />;
      default: return <Home />;
    }
  };

  return (
    <>
      {renderView()}
      <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;