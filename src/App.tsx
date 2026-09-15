import { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { TeamManagement } from './components/TeamManagement';
import { ValidationPage } from './components/ValidationPage';
import { Reports } from './components/Reports';
import Calendar from './components/Calendar';

type PageKey =
  | 'dashboard'
  | 'calendar'
  | 'team'
  | 'validation'
  | 'reports';

function isPageKey(page: string): page is PageKey {
  return (
    page === 'dashboard' ||
    page === 'calendar' ||
    page === 'team' ||
    page === 'validation' ||
    page === 'reports'
  );
}

function AppLoadingScreen() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-white"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-400"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-white">
            TaskFlow
          </h1>

          <p className="text-sm text-slate-300">
            Validando autenticação e permissões...
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const [currentPage, setCurrentPage] =
    useState<PageKey>('dashboard');

  const handlePageChange = (page: string) => {
    if (isPageKey(page)) {
      setCurrentPage(page);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <Calendar />;

      case 'team':
        return <TeamManagement />;

      case 'validation':
        return <ValidationPage />;

      case 'reports':
        return <Reports />;

      case 'dashboard':
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={handlePageChange}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

function AppContent() {
  const {
    isLoggedIn,
    currentUser,
    authLoading,
    authError,
  } = useApp();

  if (authLoading) {
    return <AppLoadingScreen />;
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <>
        {authError && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
          >
            {authError}
          </div>
        )}

        <Login />
      </>
    );
  }

  return (
    <AuthenticatedApp
      key={currentUser.firebaseUid ?? currentUser.id}
    />
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;