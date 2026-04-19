import { ReactNode, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  BarChart3, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import Settings from './Settings';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { currentUser, logout, notifications, weekInfo } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read && n.userId === currentUser?.id).length;

  const navItems = [
    { id: 'dashboard', label: 'Painel Semanal', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'validation', label: 'Validação', icon: CheckCircle },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        <h1 className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">
          Gestão de Tarefas
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixa na tela */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 lg:translate-x-0 overflow-y-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full sticky top-0">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-800">TaskFlow</h1>
                  <p className="text-xs text-gray-500">Gestão Semanal</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Week Info */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Semana Atual</span>
            </div>
            <p className="text-sm text-blue-800 mt-1 font-medium">
              {weekInfo.title.split('–')[1]?.trim() || weekInfo.title}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  currentPage === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.id === 'validation' && (
                  <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                    3
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xl overflow-hidden",
                !currentUser?.avatarUrl && (currentUser?.isAdmin ? "bg-amber-100 ring-2 ring-amber-300" : "bg-gray-100")
              )}>
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-gray-800 truncate">{currentUser?.name}</p>
                  {currentUser?.isAdmin && (
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser?.isAdmin ? 'Administrador' : currentUser?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Desktop Header - Fixo no topo */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{weekInfo.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de Configurações/Backup */}
            <Settings />
            
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-lg overflow-hidden",
                !currentUser?.avatarUrl && (currentUser?.isAdmin ? "bg-amber-100 ring-2 ring-amber-300" : "bg-gray-100")
              )}>
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar
                )}
              </div>
              <div className="hidden xl:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
                  {currentUser?.isAdmin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {currentUser?.isAdmin ? 'Administrador' : currentUser?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Dropdown */}
        {notificationsOpen && (
          <NotificationsDropdown 
            onClose={() => setNotificationsOpen(false)} 
          />
        )}

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead } = useApp();
  
  const userNotifications = notifications.filter(n => n.userId === currentUser?.id).slice(0, 10);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 lg:right-6 top-16 lg:top-20 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Notificações</h3>
          <button 
            onClick={markAllNotificationsRead}
            className="text-xs text-blue-600 hover:underline"
          >
            Marcar todas como lidas
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userNotifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-blue-50"
                  )}
                >
                  <p className="text-sm text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
