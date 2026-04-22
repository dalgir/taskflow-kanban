import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Task, TeamMember, Column, Notification, WeekInfo, TaskStatus, AbsenceEvent } from '../types';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { databaseService } from '../services/database';

interface AppState {
  tasks: Task[];
  teamMembers: TeamMember[];
  columns: Column[];
  notifications: Notification[];
  absenceEvents: AbsenceEvent[];
  currentUser: TeamMember | null;
  weekInfo: WeekInfo;
  isLoggedIn: boolean;
  authLoading: boolean;
  firebaseEnabled: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  addTaskCopies: (task: Omit<Task, 'id' | 'createdAt'>, assigneeIds: string[]) => void;
  duplicateTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newColumnId: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (memberId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  validateTask: (taskId: string, status: 'approved' | 'needs_adjustment', comment?: string) => void;
  getTasksByMember: (memberId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  addAbsenceEvent: (event: Omit<AbsenceEvent, 'id' | 'createdAt'>) => void;
  updateAbsenceEvent: (eventId: string, updates: Partial<AbsenceEvent>) => void;
  deleteAbsenceEvent: (eventId: string) => void;
  getAbsencesByDate: (date: Date) => AbsenceEvent[];
  getAbsencesByMember: (memberId: string) => AbsenceEvent[];
  isAdmin: () => boolean;
  canEditTask: (task: Task) => boolean;
  absences: AbsenceEvent[];
  importData: (data: { tasks: Task[]; teamMembers: TeamMember[]; absences: AbsenceEvent[]; notifications: Notification[] }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const getInitialWeekInfo = (): WeekInfo => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  return {
    startDate: start,
    endDate: end,
    title: `Gerência de Gestão – Semana ${format(start, 'dd', { locale: ptBR })} a ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`
  };
};

const defaultTeamMembers: TeamMember[] = [
  { id: '1', name: 'Alyson Lopes', role: 'Gerente de Gestão (Administrador)', avatar: '👨‍💼', email: 'alyson@empresa.com', isAdmin: true, isActive: true },
  { id: '2', name: 'Neuma Calixto', role: 'Apoio Técnico', avatar: '👩‍💼', email: 'neuma@empresa.com', isAdmin: false, isActive: true },
  { id: '3', name: 'Jany Barros', role: 'Apoio Técnico', avatar: '👩‍💻', email: 'jany@empresa.com', isAdmin: false, isActive: true },
  { id: '4', name: 'Mayara Aquino', role: 'Apoio Técnico', avatar: '👩‍🎨', email: 'mayara@empresa.com', isAdmin: false, isActive: true },
];

const getInitialColumns = (members: TeamMember[]): Column[] => [
  { id: 'backlog', title: 'Para essa semana', type: 'backlog' },
  ...members.map(m => ({ id: `member-${m.id}`, title: m.name, type: 'member' as const, memberId: m.id })),
  { id: 'completed', title: 'Concluídas', type: 'completed' },
];

const resolveColumnIdForAssignee = (assigneeId: string | null) => {
  return assigneeId ? `member-${assigneeId}` : 'backlog';
};

const cloneChecklist = (checklist: Task['checklist']): Task['checklist'] => {
  return checklist.map(item => ({
    ...item,
    id: generateId(),
    completed: false,
  }));
};

const cloneAttachments = (attachments: Task['attachments']): Task['attachments'] => {
  return attachments.map(item => ({
    ...item,
    id: generateId(),
  }));
};

const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Revisar relatório mensal',
    description: 'Revisar e aprovar o relatório mensal de vendas.',
    assigneeId: '1',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    checklist: [
      { id: '1', text: 'Verificar dados de vendas', completed: true },
      { id: '2', text: 'Comparar com mês anterior', completed: false },
    ],
    comments: [],
    attachments: [],
    columnId: 'member-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '6',
    title: 'Aprovar orçamento Q2',
    description: 'Revisar e aprovar orçamento do segundo trimestre.',
    assigneeId: '1',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '7',
    title: 'Reunião com diretoria',
    description: 'Preparar apresentação para reunião.',
    assigneeId: '1',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    checklist: [
      { id: '1', text: 'Slides prontos', completed: true },
    ],
    comments: [],
    attachments: [],
    columnId: 'member-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '8',
    title: 'Avaliar fornecedores',
    description: 'Comparar propostas de fornecedores.',
    assigneeId: '1',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-1',
    createdAt: new Date(),
    createdBy: '1',
  },
  {
    id: '2',
    title: 'Atualizar documentação',
    description: 'Atualizar a documentação do sistema.',
    assigneeId: '2',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [{ id: '1', name: 'Documentação atual', url: '#', type: 'link' }],
    columnId: 'member-2',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '9',
    title: 'Corrigir bug de login',
    description: 'Resolver problema no sistema de autenticação.',
    assigneeId: '2',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    checklist: [
      { id: '1', text: 'Identificar causa', completed: true },
      { id: '2', text: 'Aplicar correção', completed: false },
    ],
    comments: [],
    attachments: [],
    columnId: 'member-2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '10',
    title: 'Deploy versão 2.5',
    description: 'Realizar deploy da nova versão em produção.',
    assigneeId: '2',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-2',
    createdAt: new Date(),
    createdBy: '1',
  },
  {
    id: '3',
    title: 'Criar mockups dashboard',
    description: 'Desenvolver mockups para nova tela.',
    assigneeId: '3',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'awaiting_validation',
    checklist: [
      { id: '1', text: 'Wireframe', completed: true },
      { id: '2', text: 'Design final', completed: true },
    ],
    comments: [{ id: '1', userId: '3', text: 'Mockups finalizados.', createdAt: new Date() }],
    attachments: [],
    columnId: 'completed',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '11',
    title: 'Design sistema de ícones',
    description: 'Criar conjunto de ícones para o app.',
    assigneeId: '3',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-3',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '12',
    title: 'Atualizar guia de estilo',
    description: 'Revisar cores e tipografia do sistema.',
    assigneeId: '3',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-3',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '5',
    title: 'Análise de métricas',
    description: 'Analisar métricas de desempenho.',
    assigneeId: '4',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    checklist: [
      { id: '1', text: 'Coletar dados', completed: true },
      { id: '2', text: 'Processar informações', completed: false },
    ],
    comments: [],
    attachments: [],
    columnId: 'member-4',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '13',
    title: 'Mapear processos',
    description: 'Documentar fluxo de trabalho atual.',
    assigneeId: '4',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'member-4',
    createdAt: new Date(),
    createdBy: '1',
  },
  {
    id: '4',
    title: 'Reunião de alinhamento',
    description: 'Reunião semanal de alinhamento.',
    assigneeId: null,
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'backlog',
    createdAt: new Date(),
    createdBy: '1',
  },
  {
    id: '14',
    title: 'Planejar sprint 12',
    description: 'Definir escopo do próximo sprint.',
    assigneeId: null,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'backlog',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '15',
    title: 'Revisar contratos',
    description: 'Verificar contratos de serviços.',
    assigneeId: null,
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'backlog',
    createdAt: new Date(),
    createdBy: '1',
  },
  {
    id: '16',
    title: 'Treinamento equipe',
    description: 'Organizar treinamento mensal.',
    assigneeId: null,
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'backlog',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '17',
    title: 'Relatório semanal',
    description: 'Relatório de atividades da semana.',
    assigneeId: '1',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'approved',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'completed',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
  {
    id: '18',
    title: 'Setup ambiente dev',
    description: 'Configurar ambiente de desenvolvimento.',
    assigneeId: '2',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'completed',
    checklist: [],
    comments: [],
    attachments: [],
    columnId: 'completed',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdBy: '1',
  },
];

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          startDate: item.startDate ? new Date(item.startDate) : null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : item.endDate,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          comments: Array.isArray(item.comments)
            ? item.comments.map((comment: any) => ({
                ...comment,
                createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
              }))
            : item.comments,
        })) as T;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading from storage:', e);
  }
  return defaultValue;
};

const normalizeMember = (member: TeamMember): TeamMember => ({
  ...member,
  email: member.email.trim().toLowerCase(),
  isActive: member.isActive !== false,
});

const sortTeamMembers = (members: TeamMember[]): TeamMember[] => {
  const orderMap: Record<string, number> = {
    'Alyson Lopes': 1,
    'Neuma Calixto': 2,
    'Jany Barros': 3,
    'Mayara Aquino': 4,
  };

  return [...members].sort((a, b) => {
    const aOrder = orderMap[a.name] ?? 999;
    const bOrder = orderMap[b.name] ?? 999;
    return aOrder - bOrder;
  });
};

const canManageTask = (user: TeamMember | null, task: Task): boolean => {
  if (!user) return false;
  if (user.isAdmin) return true;
  return task.assigneeId === user.id || task.createdBy === user.id;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    sortTeamMembers(loadFromStorage('teamMembers', defaultTeamMembers).map(normalizeMember))
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage('tasks', defaultTasks)
  );
  const [columns, setColumns] = useState<Column[]>(() =>
    getInitialColumns(teamMembers)
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadFromStorage('notifications', [])
  );
  const [absenceEvents, setAbsenceEvents] = useState<AbsenceEvent[]>(() =>
    loadFromStorage('absenceEvents', [])
  );
  const firebaseEnabled = isFirebaseConfigured();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [authLoading, setAuthLoading] = useState<boolean>(firebaseEnabled);
  const [weekInfo] = useState<WeekInfo>(getInitialWeekInfo());

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    setColumns(getInitialColumns(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('absenceEvents', JSON.stringify(absenceEvents));
  }, [absenceEvents]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
  }, [currentUser, isLoggedIn]);

  const applyRemoteData = useCallback(async (memberOverride?: TeamMember | null) => {
    const [remoteMembers, remoteTasks, remoteAbsences, remoteNotifications] = await Promise.all([
      databaseService.loadTeamMembers(),
      databaseService.loadTasks(),
      databaseService.loadAbsences(),
      databaseService.loadNotifications(),
    ]);

    const normalizedMembers = sortTeamMembers((remoteMembers.length ? remoteMembers : defaultTeamMembers).map(normalizeMember));
    const nextUser = memberOverride
      ? normalizedMembers.find(member => member.id === memberOverride.id) ?? memberOverride
      : currentUser
        ? normalizedMembers.find(member => member.id === currentUser.id) ?? currentUser
        : null;

    setTeamMembers(normalizedMembers);
    setTasks(remoteTasks.length ? remoteTasks : defaultTasks);
    setAbsenceEvents(remoteAbsences);
    setNotifications(remoteNotifications);
    setCurrentUser(nextUser ?? null);
  }, [currentUser]);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setAuthLoading(false);
          return;
        }

        const remoteMembers = await databaseService.loadTeamMembers();
        const normalizedMembers = sortTeamMembers((remoteMembers.length ? remoteMembers : defaultTeamMembers).map(normalizeMember));
        const matchedMember = normalizedMembers.find(member => {
          const sameEmail = member.email === firebaseUser.email?.trim().toLowerCase();
          const uidMatches = !member.firebaseUid || member.firebaseUid === firebaseUser.uid;
          return sameEmail && uidMatches && member.isActive !== false;
        });

        if (!matchedMember) {
          await signOut(auth);
          setCurrentUser(null);
          setIsLoggedIn(false);
          setAuthLoading(false);
          return;
        }

        const hydratedMember = matchedMember.firebaseUid ? matchedMember : { ...matchedMember, firebaseUid: firebaseUser.uid };
        setTeamMembers(sortTeamMembers(normalizedMembers.map(member => member.id === hydratedMember.id ? hydratedMember : member)));
        setCurrentUser(hydratedMember);
        setIsLoggedIn(true);
        await applyRemoteData(hydratedMember);
      } catch (error) {
        console.error('Erro ao sincronizar autenticação:', error);
        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [applyRemoteData, firebaseEnabled]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, message: 'Informe um e-mail válido.' };
    }

    if (firebaseEnabled) {
      if (!auth) {
        return { success: false, message: 'A autenticação do Firebase não está disponível.' };
      }

      if (!password) {
        return { success: false, message: 'Informe sua senha para entrar.' };
      }

      try {
        setAuthLoading(true);
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const remoteMembers = await databaseService.loadTeamMembers();
        const normalizedMembers = sortTeamMembers((remoteMembers.length ? remoteMembers : defaultTeamMembers).map(normalizeMember));
        const matchedMember = normalizedMembers.find(member => {
          const sameEmail = member.email === normalizedEmail;
          const uidMatches = !member.firebaseUid || member.firebaseUid === credential.user.uid;
          return sameEmail && uidMatches && member.isActive !== false;
        });

        if (!matchedMember) {
          await signOut(auth);
          return { success: false, message: 'Usuário autenticado, mas sem autorização ativa no sistema.' };
        }

        const hydratedMember = matchedMember.firebaseUid ? matchedMember : { ...matchedMember, firebaseUid: credential.user.uid };
        setCurrentUser(hydratedMember);
        setIsLoggedIn(true);
        setTeamMembers(sortTeamMembers(normalizedMembers.map(member => member.id === hydratedMember.id ? hydratedMember : member)));
        await applyRemoteData(hydratedMember);
        return { success: true };
      } catch (error) {
        console.error('Erro de login:', error);
        return { success: false, message: 'Falha ao autenticar. Verifique e-mail, senha e permissões.' };
      } finally {
        setAuthLoading(false);
      }
    }

    const member = sortTeamMembers(teamMembers.map(normalizeMember)).find(m => m.email === normalizedEmail && m.isActive !== false);
    if (member) {
      setCurrentUser(member);
      setIsLoggedIn(true);
      return { success: true, message: 'Modo local ativo. Configure o Firebase para autenticação segura.' };
    }

    return { success: false, message: 'E-mail não encontrado.' };
  };

  const logout = async (): Promise<void> => {
    try {
      if (firebaseEnabled && auth) {
        await signOut(auth);
      }
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    if (firebaseEnabled) {
      void databaseService.saveNotifications([newNotification]).catch(error => {
        console.error('Erro ao salvar notificação:', error);
      });
    }
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const isAllowed = currentUser.isAdmin || task.assigneeId === currentUser.id || task.createdBy === currentUser.id;
    if (!isAllowed) return;

    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date(),
      createdBy: task.createdBy || currentUser.id,
    };

    setTasks(prev => [...prev, newTask]);
    if (firebaseEnabled) {
      void databaseService.saveTask(newTask).catch(error => {
        console.error('Erro ao salvar tarefa:', error);
      });
    }

    if (newTask.assigneeId) {
      addNotification({
        userId: newTask.assigneeId,
        message: `Nova tarefa atribuída: ${newTask.title}`,
        type: 'assignment',
        taskId: newTask.id,
        read: false,
      });
    }
  };

  const addTaskCopies = (task: Omit<Task, 'id' | 'createdAt'>, assigneeIds: string[]) => {
    if (!currentUser) return;

    const uniqueAssigneeIds = [...new Set(assigneeIds.filter(Boolean))];
    if (uniqueAssigneeIds.length === 0) {
      addTask(task);
      return;
    }

    const isAllowed =
      currentUser.isAdmin || uniqueAssigneeIds.every(assigneeId => assigneeId === currentUser.id);

    if (!isAllowed) return;

    const createdTasks: Task[] = uniqueAssigneeIds.map(assigneeId => ({
      ...task,
      id: generateId(),
      createdAt: new Date(),
      createdBy: task.createdBy || currentUser.id,
      assigneeId,
      columnId: resolveColumnIdForAssignee(assigneeId),
      status: 'planned',
      comments: [],
      checklist: cloneChecklist(task.checklist),
      attachments: cloneAttachments(task.attachments),
    }));

    setTasks(prev => [...prev, ...createdTasks]);

    if (firebaseEnabled) {
      void Promise.all(
        createdTasks.map(createdTask => databaseService.saveTask(createdTask))
      ).catch(error => {
        console.error('Erro ao salvar cópias da tarefa:', error);
      });
    }

    createdTasks.forEach(createdTask => {
      if (createdTask.assigneeId) {
        addNotification({
          userId: createdTask.assigneeId,
          message: `Nova tarefa atribuída: ${createdTask.title}`,
          type: 'assignment',
          taskId: createdTask.id,
          read: false,
        });
      }
    });
  };

  const duplicateTask = (taskId: string) => {
    if (!currentUser) return;

    const originalTask = tasks.find(task => task.id === taskId);
    if (!originalTask || !canManageTask(currentUser, originalTask)) return;

    const duplicatedTask: Task = {
      ...originalTask,
      id: generateId(),
      createdAt: new Date(),
      createdBy: currentUser.id,
      title: `${originalTask.title} (Cópia)`,
      status: 'planned',
      comments: [],
      checklist: cloneChecklist(originalTask.checklist),
      attachments: cloneAttachments(originalTask.attachments),
      columnId: resolveColumnIdForAssignee(originalTask.assigneeId),
    };

    setTasks(prev => [...prev, duplicatedTask]);

    if (firebaseEnabled) {
      void databaseService.saveTask(duplicatedTask).catch(error => {
        console.error('Erro ao duplicar tarefa:', error);
      });
    }

    if (duplicatedTask.assigneeId) {
      addNotification({
        userId: duplicatedTask.assigneeId,
        message: `Nova tarefa atribuída: ${duplicatedTask.title}`,
        type: 'assignment',
        taskId: duplicatedTask.id,
        read: false,
      });
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const existingTask = tasks.find(task => task.id === taskId);
    if (!existingTask || !canManageTask(currentUser, existingTask)) return;

    const updatedTask: Task = { ...existingTask, ...updates };
    setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));

    if (firebaseEnabled) {
      void databaseService.updateTask(updatedTask).catch(error => {
        console.error('Erro ao atualizar tarefa:', error);
      });
    }

    if (updates.assigneeId && updates.assigneeId !== existingTask.assigneeId) {
      addNotification({
        userId: updates.assigneeId,
        message: `Tarefa atribuída a você: ${existingTask.title}`,
        type: 'assignment',
        taskId,
        read: false,
      });
    }
  };

  const deleteTask = (taskId: string) => {
    const existingTask = tasks.find(task => task.id === taskId);
    if (!existingTask || !currentUser?.isAdmin) return;

    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (firebaseEnabled) {
      void databaseService.deleteTask(taskId).catch(error => {
        console.error('Erro ao remover tarefa:', error);
      });
    }
  };

  const moveTask = (taskId: string, newColumnId: string) => {
    const task = tasks.find(item => item.id === taskId);
    if (!task || !canManageTask(currentUser, task)) return;

    let newStatus: TaskStatus = task.status;
    const column = columns.find(c => c.id === newColumnId);

    if (column?.type === 'completed') {
      newStatus = 'awaiting_validation';
    } else if (column?.type === 'member') {
      newStatus = task.status === 'planned' ? 'in_progress' : task.status;
    } else if (column?.type === 'backlog') {
      newStatus = 'planned';
    }

    const movedTask: Task = {
      ...task,
      columnId: newColumnId,
      status: newStatus,
      assigneeId: column?.memberId || task.assigneeId,
    };

    setTasks(prev => prev.map(item => item.id === taskId ? movedTask : item));
    if (firebaseEnabled) {
      void databaseService.updateTask(movedTask).catch(error => {
        console.error('Erro ao mover tarefa:', error);
      });
    }
  };

  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    if (!currentUser?.isAdmin) return;

    const newMember: TeamMember = normalizeMember({
      ...member,
      id: generateId(),
    });

    setTeamMembers(prev => sortTeamMembers([...prev, newMember]));
    if (firebaseEnabled) {
      void databaseService.saveTeamMember(newMember).catch(error => {
        console.error('Erro ao salvar membro:', error);
      });
    }
  };

  const updateTeamMember = (memberId: string, updates: Partial<TeamMember>) => {
    if (!currentUser?.isAdmin && currentUser?.id !== memberId) return;

    const nextMembers = teamMembers.map(member =>
      member.id === memberId ? normalizeMember({ ...member, ...updates }) : member
    );
    const updatedMember = nextMembers.find(member => member.id === memberId);

    setTeamMembers(sortTeamMembers(nextMembers));
    if (updatedMember && firebaseEnabled) {
      void databaseService.saveTeamMember(updatedMember).catch(error => {
        console.error('Erro ao atualizar membro:', error);
      });
    }
  };

  const deleteTeamMember = (memberId: string) => {
    if (!currentUser?.isAdmin || currentUser.id === memberId) return;

    setTeamMembers(prev => sortTeamMembers(prev.filter(member => member.id !== memberId)));
    setTasks(prev => prev.map(task =>
      task.assigneeId === memberId
        ? { ...task, assigneeId: null, columnId: 'backlog', status: 'planned' }
        : task
    ));

    if (firebaseEnabled) {
      void databaseService.deleteTeamMember(memberId).catch(error => {
        console.error('Erro ao remover membro:', error);
      });
    }
  };

  const markNotificationRead = (notificationId: string) => {
    const target = notifications.find(notification => notification.id === notificationId);
    if (!target || (target.userId !== currentUser?.id && !currentUser?.isAdmin)) return;

    const updatedNotification = { ...target, read: true };
    setNotifications(prev => prev.map(n => n.id === notificationId ? updatedNotification : n));
    if (firebaseEnabled) {
      void databaseService.saveNotifications([updatedNotification]).catch(error => {
        console.error('Erro ao atualizar notificação:', error);
      });
    }
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;

    const updatedNotifications = notifications.map(notification =>
      notification.userId === currentUser.id ? { ...notification, read: true } : notification
    );

    setNotifications(updatedNotifications);
    if (firebaseEnabled) {
      void databaseService.saveNotifications(updatedNotifications.filter(notification => notification.userId === currentUser.id)).catch(error => {
        console.error('Erro ao atualizar notificações:', error);
      });
    }
  };

  const validateTask = (taskId: string, status: 'approved' | 'needs_adjustment', comment?: string) => {
    if (!currentUser?.isAdmin) return;

    const task = tasks.find(item => item.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      status: status === 'approved' ? 'approved' : 'in_progress',
      validationStatus: status,
      validationComment: comment,
      columnId: status === 'approved' ? 'completed' : task.columnId,
    };

    setTasks(prev => prev.map(item => item.id === taskId ? updatedTask : item));
    if (firebaseEnabled) {
      void databaseService.updateTask(updatedTask).catch(error => {
        console.error('Erro ao validar tarefa:', error);
      });
    }

    if (task.assigneeId) {
      addNotification({
        userId: task.assigneeId,
        message: status === 'approved'
          ? `Tarefa aprovada: ${task.title}`
          : `Tarefa devolvida para ajustes: ${task.title}`,
        type: 'validation',
        taskId,
        read: false,
      });
    }
  };

  const getTasksByMember = (memberId: string): Task[] => {
    return tasks.filter(task => task.assigneeId === memberId);
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  const addAbsenceEvent = (event: Omit<AbsenceEvent, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    if (!currentUser.isAdmin && currentUser.id !== event.memberId) return;

    const newEvent: AbsenceEvent = {
      ...event,
      id: generateId(),
      createdAt: new Date(),
    };

    setAbsenceEvents(prev => [...prev, newEvent]);
    if (firebaseEnabled) {
      void databaseService.saveAbsence(newEvent).catch(error => {
        console.error('Erro ao salvar ausência:', error);
      });
    }
  };

  const updateAbsenceEvent = (eventId: string, updates: Partial<AbsenceEvent>) => {
    const existingEvent = absenceEvents.find(event => event.id === eventId);
    if (!existingEvent || (!currentUser?.isAdmin && currentUser?.id !== existingEvent.memberId)) return;

    const updatedEvent = { ...existingEvent, ...updates };
    setAbsenceEvents(prev => prev.map(event => event.id === eventId ? updatedEvent : event));
    if (firebaseEnabled) {
      void databaseService.saveAbsence(updatedEvent).catch(error => {
        console.error('Erro ao atualizar ausência:', error);
      });
    }
  };

  const deleteAbsenceEvent = (eventId: string) => {
    const existingEvent = absenceEvents.find(event => event.id === eventId);
    if (!existingEvent || (!currentUser?.isAdmin && currentUser?.id !== existingEvent.memberId)) return;

    setAbsenceEvents(prev => prev.filter(event => event.id !== eventId));
    if (firebaseEnabled) {
      void databaseService.deleteAbsence(eventId).catch(error => {
        console.error('Erro ao remover ausência:', error);
      });
    }
  };

  const getAbsencesByDate = (date: Date): AbsenceEvent[] => {
    return absenceEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(12, 0, 0, 0);

      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const getAbsencesByMember = (memberId: string): AbsenceEvent[] => {
    return absenceEvents.filter(event => event.memberId === memberId);
  };

  const isAdmin = (): boolean => {
    return currentUser?.isAdmin === true;
  };

  const canEditTask = (task: Task): boolean => {
    if (currentUser?.isAdmin) return true;
    if (!currentUser) return false;
    const ownsTask = task.assigneeId === currentUser.id || task.createdBy === currentUser.id;
    return ownsTask && task.status !== 'approved';
  };

  const importData = (data: { tasks: Task[]; teamMembers: TeamMember[]; absences: AbsenceEvent[]; notifications: Notification[] }) => {
    if (!currentUser?.isAdmin) return;

    const normalizedMembers = sortTeamMembers(data.teamMembers.map(normalizeMember));
    const normalizedTasks = data.tasks.map(t => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      createdAt: new Date(t.createdAt),
      startDate: t.startDate ? new Date(t.startDate) : null,
      comments: t.comments.map(comment => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
      })),
    }));
    const normalizedAbsences = data.absences.map(a => ({
      ...a,
      startDate: new Date(a.startDate),
      endDate: new Date(a.endDate),
      createdAt: new Date(a.createdAt),
    }));
    const normalizedNotifications = data.notifications.map(n => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));

    setTasks(normalizedTasks);
    setTeamMembers(normalizedMembers);
    setAbsenceEvents(normalizedAbsences);
    setNotifications(normalizedNotifications);

    if (firebaseEnabled) {
      void Promise.all([
        databaseService.saveTasks(normalizedTasks),
        databaseService.saveTeamMembers(normalizedMembers),
        Promise.all(normalizedAbsences.map(absence => databaseService.saveAbsence(absence))),
        databaseService.saveNotifications(normalizedNotifications),
      ]).catch(error => {
        console.error('Erro ao importar dados para o Firebase:', error);
      });
    }
  };

  return (
    <AppContext.Provider value={{
      tasks,
      teamMembers,
      columns,
      notifications,
      absenceEvents,
      currentUser,
      weekInfo,
      isLoggedIn,
      authLoading,
      firebaseEnabled,
      login,
      logout,
      addTask,
      addTaskCopies,
      duplicateTask,
      updateTask,
      deleteTask,
      moveTask,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      validateTask,
      getTasksByMember,
      getTasksByStatus,
      addAbsenceEvent,
      updateAbsenceEvent,
      deleteAbsenceEvent,
      getAbsencesByDate,
      getAbsencesByMember,
      isAdmin,
      canEditTask,
      absences: absenceEvents,
      importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}