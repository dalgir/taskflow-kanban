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

  const unreadCount = notifications.filter(
    n => !n.read && n.userId === currentUser?.id
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Painel Semanal', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'validation', label: 'Validação', icon: CheckCircle },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 active:scale-[0.98]"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-sm font-semibold text-gray-800">
              Gestão de Tarefas
            </h1>
            <p className="truncate text-[11px] text-gray-500">
              {weekInfo.title}
            </p>
          </div>

          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 active:scale-[0.98]"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-dvh w-[88vw] max-w-72 border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate font-bold text-gray-800">TaskFlow</h1>
                  <p className="truncate text-xs text-gray-500">Gestão Semanal</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Week Info */}
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Semana Atual</span>
            </div>
            <p className="mt-1 text-sm font-medium text-blue-800">
              {weekInfo.title.split('–')[1]?.trim() || weekInfo.title}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                  setNotificationsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate font-medium">{item.label}</span>

                {item.id === 'validation' && (
                  <span className="ml-auto rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                    3
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-xl',
                  !currentUser?.avatarUrl &&
                    (currentUser?.isAdmin
                      ? 'bg-amber-100 ring-2 ring-amber-300'
                      : 'bg-gray-100')
                )}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  currentUser?.avatar
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium text-gray-800">
                    {currentUser?.name}
                  </p>
                  {currentUser?.isAdmin && (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                </div>
                <p className="truncate text-xs text-gray-500">
                  {currentUser?.isAdmin ? 'Administrador' : currentUser?.role}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-dvh lg:ml-64">
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur lg:flex">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-800">
              {weekInfo.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Settings />

            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-xl p-2.5 transition hover:bg-gray-100"
              aria-label="Abrir notificações"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-lg',
                  !currentUser?.avatarUrl &&
                    (currentUser?.isAdmin
                      ? 'bg-amber-100 ring-2 ring-amber-300'
                      : 'bg-gray-100')
                )}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  currentUser?.avatar
                )}
              </div>

              <div className="hidden xl:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-800">
                    {currentUser?.name}
                  </p>
                  {currentUser?.isAdmin && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <ShieldCheck className="h-3 w-3" />
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
          <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
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

  const userNotifications = notifications
    .filter(n => n.userId === currentUser?.id)
    .slice(0, 10);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed right-4 top-16 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl lg:right-6 lg:top-20">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
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
              <Bell className="mx-auto mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userNotifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors hover:bg-gray-50',
                    !notification.read && 'bg-blue-50'
                  )}
                >
                  <p className="text-sm text-gray-800">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
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