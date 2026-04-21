import { useMemo, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { TeamManagement } from './components/TeamManagement';
import { ValidationPage } from './components/ValidationPage';
import { Reports } from './components/Reports';
import Calendar from './components/Calendar';

type PageKey = 'dashboard' | 'calendar' | 'team' | 'validation' | 'reports';

function AppLoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-white">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-400" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-white">TaskFlow</h1>
          <p className="text-sm text-slate-300">
            Validando autenticação e permissões...
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isLoggedIn, authLoading } = useApp();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');

  const currentView = useMemo(() => {
    const pages: Record<PageKey, JSX.Element> = {
      dashboard: <KanbanBoard />,
      calendar: <Calendar />,
      team: <TeamManagement />,
      validation: <ValidationPage />,
      reports: <Reports />,
    };

    return pages[currentPage] ?? pages.dashboard;
  }, [currentPage]);

  if (authLoading) {
    return <AppLoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={(page) => setCurrentPage(page as PageKey)}>
      {currentView}
    </Layout>
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