import { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { TeamManagement } from './components/TeamManagement';
import { ValidationPage } from './components/ValidationPage';
import { Reports } from './components/Reports';
import Calendar from './components/Calendar';

function AppContent() {
  const { isLoggedIn, authLoading } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-300">Validando autenticação e permissões...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <KanbanBoard />;
      case 'calendar':
        return <Calendar />;
      case 'team':
        return <TeamManagement />;
      case 'validation':
        return <ValidationPage />;
      case 'reports':
        return <Reports />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
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
