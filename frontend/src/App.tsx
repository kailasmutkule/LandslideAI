import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { EarlyWarningsPage } from './pages/EarlyWarningsPage';
import { SensorsPage } from './pages/SensorsPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { HistoricalPage } from './pages/HistoricalPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const MainApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // URL routing synchronized with window.location.pathname or hash
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
      const path = window.location.pathname;
      return path && path !== '/' ? path : '/';
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.location.hash = path;
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
            Initializing Command Environment...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated and on login page or attempting access
  if (!isAuthenticated && currentPath !== '/login') {
    return <LoginPage onLoginSuccess={() => navigate('/')} />;
  }

  if (currentPath === '/login') {
    return <LoginPage onLoginSuccess={() => navigate('/')} />;
  }

  // Route selector
  const renderCurrentPage = () => {
    if (currentPath.startsWith('/location/')) {
      const id = currentPath.replace('/location/', '');
      return <LocationDetailPage locationId={id} onNavigate={navigate} />;
    }

    switch (currentPath) {
      case '/':
        return <OverviewPage onNavigate={navigate} />;
      case '/risk-map':
        return <RiskMapPage />;
      case '/predictions':
        return <PredictionsPage />;
      case '/alerts':
        return <EarlyWarningsPage onNavigate={navigate} />;
      case '/sensors':
        return <SensorsPage />;
      case '/hotspots':
        return <HotspotsPage onNavigate={navigate} />;
      case '/historical':
        return <HistoricalPage />;
      case '/location':
        return <LocationDetailPage onNavigate={navigate} />;
      case '/reports':
        return <ReportsPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      <ErrorBoundary>
        {renderCurrentPage()}
      </ErrorBoundary>
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
