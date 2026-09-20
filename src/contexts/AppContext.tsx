import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import {
  Task,
  TeamMember,
  Column,
  Notification,
  WeekInfo,
  TaskStatus,
  AbsenceEvent,
} from '../types';

import {
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';

import { ptBR } from 'date-fns/locale';

import {
  auth,
  isFirebaseConfigured,
} from '../config/firebase';

import {
  databaseService,
} from '../services/database';

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
  authError: string;
  firebaseEnabled: boolean;
}

interface AppContextType extends AppState {
  login: (
    email: string,
    password?: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  register: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  logout: () => Promise<void>;

  addTask: (
    task: Omit<Task, 'id' | 'createdAt'>
  ) => void;

  addTaskCopies: (
    task: Omit<Task, 'id' | 'createdAt'>,
    assigneeIds: string[]
  ) => void;

  duplicateTask: (
    taskId: string
  ) => void;

  updateTask: (
    taskId: string,
    updates: Partial<Task>
  ) => void;

  deleteTask: (
    taskId: string
  ) => void;

  moveTask: (
    taskId: string,
    newColumnId: string
  ) => void;

  addTeamMember: (
  member: Omit<TeamMember, 'id'>
) => Promise<void>;

  updateTeamMember: (
  memberId: string,
  updates: Partial<TeamMember>
) => Promise<void>;

  deleteTeamMember: (
  memberId: string
) => Promise<void>;

  addNotification: (
    notification: Omit<
      Notification,
      'id' | 'createdAt'
    >
  ) => void;

  markNotificationRead: (
    notificationId: string
  ) => void;

  markAllNotificationsRead: () => void;

  validateTask: (
    taskId: string,
    status:
      | 'approved'
      | 'needs_adjustment',
    comment?: string
  ) => void;

  getTasksByMember: (
    memberId: string
  ) => Task[];

  getTasksByStatus: (
    status: TaskStatus
  ) => Task[];

  addAbsenceEvent: (
    event: Omit<
      AbsenceEvent,
      'id' | 'createdAt'
    >
  ) => void;

  updateAbsenceEvent: (
    eventId: string,
    updates: Partial<AbsenceEvent>
  ) => void;

  deleteAbsenceEvent: (
    eventId: string
  ) => void;

  getAbsencesByDate: (
    date: Date
  ) => AbsenceEvent[];

  getAbsencesByMember: (
    memberId: string
  ) => AbsenceEvent[];

  isAdmin: () => boolean;

  canEditTask: (
    task: Task
  ) => boolean;

  absences: AbsenceEvent[];

  importData: (data: {
    tasks: Task[];
    teamMembers: TeamMember[];
    absences: AbsenceEvent[];
    notifications: Notification[];
  }) => void;
}

const AppContext =
  createContext<
    AppContextType | undefined
  >(undefined);

const generateId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return Math.random()
    .toString(36)
    .slice(2, 11);
};

const getInitialWeekInfo =
  (): WeekInfo => {
    const today =
      new Date();

    const start =
      startOfWeek(
        today,
        {
          weekStartsOn: 1,
        }
      );

    const end =
      endOfWeek(
        today,
        {
          weekStartsOn: 1,
        }
      );

    return {
      startDate: start,
      endDate: end,

      title:
        `Gerência de Gestão – Semana ${format(
          start,
          'dd',
          {
            locale: ptBR,
          }
        )} a ${format(
          end,
          'dd/MM/yyyy',
          {
            locale: ptBR,
          }
        )}`,
    };
  };

const defaultTeamMembers:
  TeamMember[] = [
    {
      id: '1',
      name: 'Alyson Lopes',
      role:
        'Gerente de Gestão (Administrador)',
      avatar: '👨‍💼',
      email:
        'alyson@empresa.com',
      isAdmin: true,
      isActive: true,
    },

    {
      id: '2',
      name: 'Neuma Calixto',
      role:
        'Apoio Técnico',
      avatar: '👩‍💼',
      email:
        'neuma@empresa.com',
      isAdmin: false,
      isActive: true,
    },

    {
      id: '3',
      name: 'Jany Barros',
      role:
        'Apoio Técnico',
      avatar: '👩‍💻',
      email:
        'jany@empresa.com',
      isAdmin: false,
      isActive: true,
    },

    {
      id: '4',
      name: 'Mayara Aquino',
      role:
        'Apoio Técnico',
      avatar: '👩‍🎨',
      email:
        'mayara@empresa.com',
      isAdmin: false,
      isActive: true,
    },
  ];

const getInitialColumns = (
  members: TeamMember[]
): Column[] => [
  {
    id: 'backlog',
    title:
      'Para essa semana',
    type: 'backlog',
  },

  ...members.map(
    (member) => ({
      id:
        `member-${member.id}`,
      title:
        member.name,
      type:
        'member' as const,
      memberId:
        member.id,
    })
  ),

  {
    id: 'completed',
    title:
      'Concluídas',
    type: 'completed',
  },
];

const resolveColumnIdForAssignee = (
  assigneeId: string | null
) => {
  return assigneeId
    ? `member-${assigneeId}`
    : 'backlog';
};

const cloneChecklist = (
  checklist:
    Task['checklist']
): Task['checklist'] => {
  return checklist.map(
    (item) => ({
      ...item,
      id:
        generateId(),
      completed:
        false,
    })
  );
};

const cloneAttachments = (
  attachments:
    Task['attachments']
): Task['attachments'] => {
  return attachments.map(
    (item) => ({
      ...item,
      id:
        generateId(),
    })
  );
};

const defaultTasks: Task[] = [
  {
    id: '1',
    title:
      'Revisar relatório mensal',
    description:
      'Revisar e aprovar o relatório mensal de vendas.',
    assigneeId: '1',

    startDate:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),

    dueDate:
      new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000
      ),

    status:
      'in_progress',

    checklist: [
      {
        id: '1',
        text:
          'Verificar dados de vendas',
        completed:
          true,
      },

      {
        id: '2',
        text:
          'Comparar com mês anterior',
        completed:
          false,
      },
    ],

    comments: [],
    attachments: [],
    columnId:
      'member-1',

    createdAt:
      new Date(
        Date.now() -
          3 * 24 * 60 * 60 * 1000
      ),

    createdBy:
      '1',
  },

  {
    id: '6',
    title:
      'Aprovar orçamento Q2',
    description:
      'Revisar e aprovar orçamento do segundo trimestre.',
    assigneeId:
      '1',
    startDate:
      new Date(),
    dueDate:
      new Date(
        Date.now() +
          3 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-1',
    createdAt:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '7',
    title:
      'Reunião com diretoria',
    description:
      'Preparar apresentação para reunião.',
    assigneeId:
      '1',
    startDate:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    status:
      'in_progress',
    checklist: [
      {
        id: '1',
        text:
          'Slides prontos',
        completed:
          true,
      },
    ],
    comments: [],
    attachments: [],
    columnId:
      'member-1',
    createdAt:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '8',
    title:
      'Avaliar fornecedores',
    description:
      'Comparar propostas de fornecedores.',
    assigneeId:
      '1',
    startDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          5 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-1',
    createdAt:
      new Date(),
    createdBy:
      '1',
  },

  {
    id: '2',
    title:
      'Atualizar documentação',
    description:
      'Atualizar a documentação do sistema.',
    assigneeId:
      '2',
    startDate:
      new Date(),
    dueDate:
      new Date(
        Date.now() +
          3 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [
      {
        id: '1',
        name:
          'Documentação atual',
        url: '#',
        type:
          'link',
      },
    ],
    columnId:
      'member-2',
    createdAt:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '9',
    title:
      'Corrigir bug de login',
    description:
      'Resolver problema no sistema de autenticação.',
    assigneeId:
      '2',
    startDate:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    status:
      'in_progress',
    checklist: [
      {
        id: '1',
        text:
          'Identificar causa',
        completed:
          true,
      },
      {
        id: '2',
        text:
          'Aplicar correção',
        completed:
          false,
      },
    ],
    comments: [],
    attachments: [],
    columnId:
      'member-2',
    createdAt:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '10',
    title:
      'Deploy versão 2.5',
    description:
      'Realizar deploy da nova versão em produção.',
    assigneeId:
      '2',
    startDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-2',
    createdAt:
      new Date(),
    createdBy:
      '1',
  },

  {
    id: '3',
    title:
      'Criar mockups dashboard',
    description:
      'Desenvolver mockups para nova tela.',
    assigneeId:
      '3',
    startDate:
      new Date(
        Date.now() -
          3 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    status:
      'awaiting_validation',
    checklist: [
      {
        id: '1',
        text:
          'Wireframe',
        completed:
          true,
      },
      {
        id: '2',
        text:
          'Design final',
        completed:
          true,
      },
    ],
    comments: [
      {
        id: '1',
        userId:
          '3',
        text:
          'Mockups finalizados.',
        createdAt:
          new Date(),
      },
    ],
    attachments: [],
    columnId:
      'completed',
    createdAt:
      new Date(
        Date.now() -
          4 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '11',
    title:
      'Design sistema de ícones',
    description:
      'Criar conjunto de ícones para o app.',
    assigneeId:
      '3',
    startDate:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          4 * 24 * 60 * 60 * 1000
      ),
    status:
      'in_progress',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-3',
    createdAt:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '12',
    title:
      'Atualizar guia de estilo',
    description:
      'Revisar cores e tipografia do sistema.',
    assigneeId:
      '3',
    startDate:
      new Date(),
    dueDate:
      new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-3',
    createdAt:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '5',
    title:
      'Análise de métricas',
    description:
      'Analisar métricas de desempenho.',
    assigneeId:
      '4',
    startDate:
      new Date(
        Date.now() -
          3 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    status:
      'in_progress',
    checklist: [
      {
        id: '1',
        text:
          'Coletar dados',
        completed:
          true,
      },
      {
        id: '2',
        text:
          'Processar informações',
        completed:
          false,
      },
    ],
    comments: [],
    attachments: [],
    columnId:
      'member-4',
    createdAt:
      new Date(
        Date.now() -
          4 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '13',
    title:
      'Mapear processos',
    description:
      'Documentar fluxo de trabalho atual.',
    assigneeId:
      '4',
    startDate:
      new Date(
        Date.now() +
          1 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          3 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'member-4',
    createdAt:
      new Date(),
    createdBy:
      '1',
  },

  {
    id: '4',
    title:
      'Reunião de alinhamento',
    description:
      'Reunião semanal de alinhamento.',
    assigneeId:
      null,
    startDate:
      new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          4 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'backlog',
    createdAt:
      new Date(),
    createdBy:
      '1',
  },

  {
    id: '14',
    title:
      'Planejar sprint 12',
    description:
      'Definir escopo do próximo sprint.',
    assigneeId:
      null,
    startDate:
      new Date(
        Date.now() +
          3 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          5 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'backlog',
    createdAt:
      new Date(
        Date.now() -
          1 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '15',
    title:
      'Revisar contratos',
    description:
      'Verificar contratos de serviços.',
    assigneeId:
      null,
    startDate:
      new Date(
        Date.now() +
          4 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          6 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'backlog',
    createdAt:
      new Date(),
    createdBy:
      '1',
  },

  {
    id: '16',
    title:
      'Treinamento equipe',
    description:
      'Organizar treinamento mensal.',
    assigneeId:
      null,
    startDate:
      new Date(
        Date.now() +
          5 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
    status:
      'planned',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'backlog',
    createdAt:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '17',
    title:
      'Relatório semanal',
    description:
      'Relatório de atividades da semana.',
    assigneeId:
      '1',
    startDate:
      new Date(
        Date.now() -
          5 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() -
          2 * 24 * 60 * 60 * 1000
      ),
    status:
      'approved',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'completed',
    createdAt:
      new Date(
        Date.now() -
          6 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },

  {
    id: '18',
    title:
      'Setup ambiente dev',
    description:
      'Configurar ambiente de desenvolvimento.',
    assigneeId:
      '2',
    startDate:
      new Date(
        Date.now() -
          5 * 24 * 60 * 60 * 1000
      ),
    dueDate:
      new Date(
        Date.now() -
          3 * 24 * 60 * 60 * 1000
      ),
    status:
      'completed',
    checklist: [],
    comments: [],
    attachments: [],
    columnId:
      'completed',
    createdAt:
      new Date(
        Date.now() -
          6 * 24 * 60 * 60 * 1000
      ),
    createdBy:
      '1',
  },
];

const clearLegacyStorage = () => {
  const keys = [
    'tasks', 'teamMembers', 'notifications', 'absenceEvents', 'absences',
    'currentUser', 'isLoggedIn', 'taskflow_tasks', 'taskflow_teamMembers',
    'taskflow_notifications', 'taskflow_absences',
  ];
  for (const key of keys) {
    try { localStorage.removeItem(key); }
    catch { /* O navegador pode bloquear o acesso ao armazenamento. */ }
  }
};

const normalizeMember = (
  member: TeamMember
): TeamMember => ({
  ...member,

  email:
    member.email
      .trim()
      .toLowerCase(),

  isActive:
    member.isActive !== false,
});

const sortTeamMembers = (
  members: TeamMember[]
): TeamMember[] => {
  const orderMap:
    Record<
      string,
      number
    > = {
    'Alyson Lopes':
      1,
    'Neuma Calixto':
      2,
    'Jany Barros':
      3,
    'Mayara Aquino':
      4,
  };

  return [
    ...members,
  ].sort(
    (
      a,
      b
    ) => {
      const aOrder =
        orderMap[
          a.name
        ] ?? 999;

      const bOrder =
        orderMap[
          b.name
        ] ?? 999;

      return (
        aOrder -
        bOrder
      );
    }
  );
};

const canManageTask = (
  user:
    TeamMember | null,
  task:
    Task
): boolean => {
  if (!user) {
    return false;
  }

  if (
    user.isAdmin
  ) {
    return true;
  }

  return (
    task.assigneeId ===
      user.id ||
    task.createdBy ===
      user.id
  );
};

export function AppProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const firebaseEnabled = isFirebaseConfigured();
  const demoEnabled = import.meta.env.DEV && !firebaseEnabled;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    demoEnabled ? sortTeamMembers(defaultTeamMembers.map(normalizeMember)) : []
  );
  const [tasks, setTasks] = useState<Task[]>(() => demoEnabled ? defaultTasks : []);
  const [columns, setColumns] = useState<Column[]>(() => getInitialColumns(teamMembers));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [absenceEvents, setAbsenceEvents] = useState<AbsenceEvent[]>([]);

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [authError, setAuthError] = useState('');
  const sessionVersion = useRef(0);
  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setTasks([]);
    setTeamMembers([]);
    setNotifications([]);
    setAbsenceEvents([]);
    setColumns([]);
    clearLegacyStorage();
  }, []);

  const [
    weekInfo,
  ] =
    useState<WeekInfo>(
      getInitialWeekInfo()
    );

  // A equipe determina as colunas, sem persistir dados no navegador.
  useEffect(() => {
    setColumns(getInitialColumns(teamMembers));
  }, [teamMembers]);

  // Remove cópias deixadas pelas versões anteriores, inclusive antes do login.
  useEffect(() => {
    clearLegacyStorage();
  }, []);

  /*
   * =========================================
   * CARREGAMENTO DOS DADOS DO USUÁRIO
   * =========================================
   *
   * Aqui está uma das correções principais.
   *
   * Administrador:
   * - todas as tarefas
   * - todas as notificações
   *
   * Membro comum:
   * - somente tarefas permitidas
   * - somente notificações permitidas
   */
  const applyRemoteData = useCallback(
  async (member: TeamMember, version: number) => {
    const [
      remoteMembers,
      remoteTasks,
      remoteAbsences,
      remoteNotifications,
    ] = await Promise.all([
      databaseService.loadTeamMembers(),
      databaseService.loadTasksForMember(member),
      databaseService.loadAbsences(member),
      databaseService.loadNotificationsForMember(member),
    ]);

    if (
      sessionVersion.current !== version ||
      auth?.currentUser?.uid !== member.firebaseUid
    ) {
      return;
    }

    setTeamMembers(
      sortTeamMembers(remoteMembers.map(normalizeMember))
    );
    setTasks(remoteTasks);
    setAbsenceEvents(remoteAbsences);
    setNotifications(remoteNotifications);
  },
  []
);

  /* Sessão real: somente este observador libera o aplicativo. */
  useEffect(() => {
  if (!firebaseEnabled || !auth) {
    clearSession();
    setAuthLoading(false);
    return;
  }

  const firebaseAuth = auth;
  let disposed = false;

  const unsubscribe = onAuthStateChanged(
    firebaseAuth,
    async firebaseUser => {
      const version = ++sessionVersion.current;

      const isCurrent = () =>
        !disposed &&
        sessionVersion.current === version &&
        firebaseAuth.currentUser?.uid === firebaseUser?.uid;

      clearSession();
      setAuthLoading(true);

      if (!firebaseUser) {
        setAuthLoading(false);
        return;
      }

      setAuthError('');

      try {
        // Busca as claims atualizadas nesta validacao de sessao.
        const tokenResult = await firebaseUser.getIdTokenResult(true);

        if (!isCurrent()) return;

        const claimMemberId = tokenResult.claims.memberId;
        const claimIsAdmin = tokenResult.claims.isAdmin;

        if (
          typeof claimMemberId !== 'string' ||
          claimMemberId.trim().length === 0 ||
          typeof claimIsAdmin !== 'boolean'
        ) {
          throw new Error(
            'As permissões desta conta ainda não foram configuradas. Fale com o administrador.'
          );
        }

        const member =
          await databaseService.loadTeamMemberByUid(firebaseUser.uid);

        if (!isCurrent()) return;

        if (!member || member.isActive !== true) {
          throw new Error(
            'Cadastro inexistente ou desativado. Fale com o administrador.'
          );
        }

        const normalizedMember = normalizeMember(member);

        if (
          member.firebaseUid &&
          member.firebaseUid !== firebaseUser.uid
        ) {
          throw new Error(
            'A conta não corresponde ao cadastro do membro.'
          );
        }

        if (
          normalizedMember.id !== claimMemberId ||
          member.isAdmin !== claimIsAdmin
        ) {
          throw new Error(
            'As permissões da conta estão diferentes do cadastro. Fale com o administrador para sincronizá-las.'
          );
        }

        // Mantido enquanto as regras atuais ainda comparam e-mail.
        if (
          normalizedMember.email !==
          firebaseUser.email?.trim().toLowerCase()
        ) {
          throw new Error(
            'O e-mail da conta não corresponde ao cadastro do membro.'
          );
        }

        const hydratedMember: TeamMember = {
          ...normalizedMember,
          id: claimMemberId,
          isAdmin: claimIsAdmin,
          firebaseUid: firebaseUser.uid,
        };

        await applyRemoteData(hydratedMember, version);

        if (!isCurrent()) return;

        setCurrentUser(hydratedMember);
        setIsLoggedIn(true);
      } catch (error) {
        if (!isCurrent()) return;

        clearSession();

        const code = (error as { code?: string })?.code;

        setAuthError(
          code === 'permission-denied'
            ? 'Seu acesso não tem permissão de leitura. Fale com o administrador.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível validar sua sessão.'
        );

        console.error('Falha ao validar a sessão:', error);

        try {
          await signOut(firebaseAuth);
        } catch {
          if (isCurrent()) {
            setAuthError(
              'Não foi possível encerrar a sessão. Tente sair novamente.'
            );
          }
        }
      } finally {
        if (isCurrent()) {
          setAuthLoading(false);
        }
      }
    }
  );

  return () => {
    disposed = true;
    ++sessionVersion.current;
    unsubscribe();
  };
}, [firebaseEnabled, clearSession, applyRemoteData]);
  /*
   * =========================================
   * LOGIN
   * =========================================
   */
  const login = async (
    email: string,
    password?: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return {
        success:
          false,

        message:
          'Informe um e-mail válido.',
      };
    }

    if (
      firebaseEnabled
    ) {
      if (!auth) {
        return {
          success:
            false,

          message:
            'A autenticação do Firebase não está disponível.',
        };
      }

      if (
        !password
      ) {
        return {
          success:
            false,

          message:
            'Informe sua senha para entrar.',
        };
      }

      try {
        setAuthError('');
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        // A confirmação de membro e o carregamento pertencem ao observador.
        return { success: true };
      } catch (error) {
        const code = (error as { code?: string })?.code;
        const message = code === 'auth/network-request-failed'
          ? 'Verifique sua conexão e tente novamente.'
          : code === 'auth/too-many-requests'
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : 'Não foi possível entrar. Verifique seu e-mail e sua senha.';
        setAuthError(message);
        return { success: false, message };
      }
    }

    /*
     * ======================================
     * MODO LOCAL
     * ======================================
     */
    if (!import.meta.env.DEV) {
      return { success: false, message: 'Configure o Firebase para entrar em produção.' };
    }
    const member =
      sortTeamMembers(
        teamMembers.map(
          normalizeMember
        )
      ).find(
        (
          item
        ) =>
          item.email ===
            normalizedEmail &&
          item.isActive !==
            false
      );

    if (
      member
    ) {
      setCurrentUser(
        member
      );

      setIsLoggedIn(
        true
      );

      return {
        success:
          true,

        message:
          'Modo local ativo. Configure o Firebase para autenticação segura.',
      };
    }

    return {
      success:
        false,

      message:
        'E-mail não encontrado.',
    };
  };

  /*
   * =========================================
   * PRIMEIRO ACESSO / DEFINIR SENHA
   * =========================================
   *
   * Os usuários já existem no Firebase
   * Authentication.
   *
   * Por isso NÃO criamos outra conta.
   *
   * Enviamos o link oficial do Firebase
   * para o usuário definir/trocar sua senha.
   *
   * Mantivemos o nome "register" por enquanto
   * para não quebrar o Login.tsx existente.
   *
   * O parâmetro password será removido da tela
   * no passo do Login.tsx.
   */
  const register = async (
    email: string,
    _password: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return {
        success:
          false,

        message:
          'Informe um e-mail válido.',
      };
    }

    if (
      !firebaseEnabled
    ) {
      return {
        success:
          false,

        message:
          'O Firebase precisa estar configurado para definir sua senha.',
      };
    }

    if (!auth) {
      return {
        success:
          false,

        message:
          'A autenticação do Firebase não está disponível.',
      };
    }

    try {


      /*
       * O próprio Firebase envia um
       * e-mail seguro para o funcionário.
       *
       * Ele clica no link e escolhe
       * a senha pessoal.
       */
      await sendPasswordResetEmail(
        auth,
        normalizedEmail
      );

      return {
        success:
          true,

        message:
          'Enviamos um link para seu e-mail. Abra a mensagem do Firebase e crie sua senha. Depois volte ao TaskFlow e entre normalmente.',
      };
    } catch (
      error: any
    ) {
      console.error(
        'Erro ao solicitar criação de senha:',
        error
      );

      if (
        error?.code ===
        'auth/invalid-email'
      ) {
        return {
          success:
            false,

          message:
            'O e-mail informado é inválido.',
        };
      }

      if (
        error?.code ===
        'auth/user-not-found'
      ) {
        return {
          success:
            false,

          message:
            'Este e-mail ainda não possui usuário no Firebase Authentication. Solicite o cadastro ao administrador.',
        };
      }

      if (
        error?.code ===
        'auth/too-many-requests'
      ) {
        return {
          success:
            false,

          message:
            'Foram feitas muitas solicitações. Aguarde alguns minutos e tente novamente.',
        };
      }

      if (
        error?.code ===
        'auth/network-request-failed'
      ) {
        return {
          success:
            false,

          message:
            'Falha de conexão. Verifique sua internet e tente novamente.',
        };
      }

      return {
        success:
          false,

        message:
          'Não foi possível enviar o link para criação da senha.',
      };
    }
  };

  /*
   * =========================================
   * LOGOUT
   * =========================================
   */
  const logout = async (): Promise<void> => {
    ++sessionVersion.current;
    clearSession();
    setAuthLoading(false);
    if (auth) {
      try { await signOut(auth); }
      catch { setAuthError('Não foi possível encerrar a sessão no Firebase. Tente novamente.'); }
    }
    if (!firebaseEnabled && import.meta.env.DEV) {
      setTeamMembers(defaultTeamMembers.map(normalizeMember));
      setTasks(defaultTasks);
    }
  };

  /*
   * =========================================
   * NOTIFICAÇÕES
   * =========================================
   */
  const addNotification = (
    notification: Omit<
      Notification,
      'id' | 'createdAt'
    >
  ) => {
    const newNotification:
      Notification = {
      ...notification,

      id:
        generateId(),

      createdAt:
        new Date(),
    };

    setNotifications(
      (
        prev
      ) => [
        newNotification,
        ...prev,
      ]
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveNotifications(
          [
            newNotification,
          ]
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao salvar notificação:',
              error
            );
          }
        );
    }
  };

  /*
   * =========================================
   * TAREFAS
   * =========================================
   */
  const addTask = (
    task: Omit<
      Task,
      'id' | 'createdAt'
    >
  ) => {
    if (
      !currentUser
    ) {
      return;
    }

    const isAllowed =
      currentUser.isAdmin ||
      task.assigneeId ===
        currentUser.id ||
      task.createdBy ===
        currentUser.id;

    if (
      !isAllowed
    ) {
      return;
    }

    const newTask:
      Task = {
      ...task,

      id:
        generateId(),

      createdAt:
        new Date(),

      createdBy:
        task.createdBy ||
        currentUser.id,
    };

    setTasks(
      (
        prev
      ) => [
        ...prev,
        newTask,
      ]
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveTask(
          newTask
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao salvar tarefa:',
              error
            );
          }
        );
    }

    if (
      newTask.assigneeId
    ) {
      addNotification({
        userId:
          newTask.assigneeId,

        message:
          `Nova tarefa atribuída: ${newTask.title}`,

        type:
          'assignment',

        taskId:
          newTask.id,

        read:
          false,
      });
    }
  };

  const addTaskCopies = (
    task: Omit<
      Task,
      'id' | 'createdAt'
    >,

    assigneeIds:
      string[]
  ) => {
    if (
      !currentUser
    ) {
      return;
    }

    const uniqueAssigneeIds = [
      ...new Set(
        assigneeIds.filter(
          Boolean
        )
      ),
    ];

    if (
      uniqueAssigneeIds.length ===
      0
    ) {
      addTask(
        task
      );

      return;
    }

    const isAllowed =
      currentUser.isAdmin ||
      uniqueAssigneeIds.every(
        (
          assigneeId
        ) =>
          assigneeId ===
          currentUser.id
      );

    if (
      !isAllowed
    ) {
      return;
    }

    const createdTasks:
      Task[] =
      uniqueAssigneeIds.map(
        (
          assigneeId
        ) => ({
          ...task,

          id:
            generateId(),

          createdAt:
            new Date(),

          createdBy:
            task.createdBy ||
            currentUser.id,

          assigneeId,

          columnId:
            resolveColumnIdForAssignee(
              assigneeId
            ),

          status:
            'planned',

          comments:
            [],

          checklist:
            cloneChecklist(
              task.checklist
            ),

          attachments:
            cloneAttachments(
              task.attachments
            ),
        })
      );

    setTasks(
      (
        prev
      ) => [
        ...prev,
        ...createdTasks,
      ]
    );

    if (
      firebaseEnabled
    ) {
      void Promise.all(
        createdTasks.map(
          (
            createdTask
          ) =>
            databaseService.saveTask(
              createdTask
            )
        )
      ).catch(
        (
          error
        ) => {
          console.error(
            'Erro ao salvar cópias da tarefa:',
            error
          );
        }
      );
    }

    createdTasks.forEach(
      (
        createdTask
      ) => {
        if (
          createdTask.assigneeId
        ) {
          addNotification({
            userId:
              createdTask.assigneeId,

            message:
              `Nova tarefa atribuída: ${createdTask.title}`,

            type:
              'assignment',

            taskId:
              createdTask.id,

            read:
              false,
          });
        }
      }
    );
  };

  const duplicateTask = (
    taskId:
      string
  ) => {
    if (
      !currentUser
    ) {
      return;
    }

    const originalTask =
      tasks.find(
        (
          task
        ) =>
          task.id ===
          taskId
      );

    if (
      !originalTask ||
      !canManageTask(
        currentUser,
        originalTask
      )
    ) {
      return;
    }

    const duplicatedTask:
      Task = {
      ...originalTask,

      id:
        generateId(),

      createdAt:
        new Date(),

      createdBy:
        currentUser.id,

      title:
        `${originalTask.title} (Cópia)`,

      status:
        'planned',

      comments:
        [],

      checklist:
        cloneChecklist(
          originalTask.checklist
        ),

      attachments:
        cloneAttachments(
          originalTask.attachments
        ),

      columnId:
        resolveColumnIdForAssignee(
          originalTask.assigneeId
        ),
    };

    setTasks(
      (
        prev
      ) => [
        ...prev,
        duplicatedTask,
      ]
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveTask(
          duplicatedTask
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao duplicar tarefa:',
              error
            );
          }
        );
    }

    if (
      duplicatedTask.assigneeId
    ) {
      addNotification({
        userId:
          duplicatedTask.assigneeId,

        message:
          `Nova tarefa atribuída: ${duplicatedTask.title}`,

        type:
          'assignment',

        taskId:
          duplicatedTask.id,

        read:
          false,
      });
    }
  };

  const updateTask = (
    taskId:
      string,

    updates:
      Partial<Task>
  ) => {
    const existingTask =
      tasks.find(
        (
          task
        ) =>
          task.id ===
          taskId
      );

    if (
      !existingTask ||
      !canManageTask(
        currentUser,
        existingTask
      )
    ) {
      return;
    }

    const updatedTask:
      Task = {
      ...existingTask,
      ...updates,
    };

    setTasks(
      (
        prev
      ) =>
        prev.map(
          (
            task
          ) =>
            task.id ===
            taskId
              ? updatedTask
              : task
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .updateTask(
          updatedTask
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao atualizar tarefa:',
              error
            );
          }
        );
    }

    if (
      updates.assigneeId &&
      updates.assigneeId !==
        existingTask.assigneeId
    ) {
      addNotification({
        userId:
          updates.assigneeId,

        message:
          `Tarefa atribuída a você: ${existingTask.title}`,

        type:
          'assignment',

        taskId,

        read:
          false,
      });
    }
  };

  const deleteTask = (
    taskId:
      string
  ) => {
    const existingTask =
      tasks.find(
        (
          task
        ) =>
          task.id ===
          taskId
      );

    if (
      !existingTask ||
      !currentUser?.isAdmin
    ) {
      return;
    }

    setTasks(
      (
        prev
      ) =>
        prev.filter(
          (
            task
          ) =>
            task.id !==
            taskId
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .deleteTask(
          taskId
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao remover tarefa:',
              error
            );
          }
        );
    }
  };

  const moveTask = (
    taskId:
      string,

    newColumnId:
      string
  ) => {
    const task =
      tasks.find(
        (
          item
        ) =>
          item.id ===
          taskId
      );

    if (
      !task ||
      !canManageTask(
        currentUser,
        task
      )
    ) {
      return;
    }

    let newStatus:
      TaskStatus =
      task.status;

    const column =
      columns.find(
        (
          item
        ) =>
          item.id ===
          newColumnId
      );

    if (
      column?.type ===
      'completed'
    ) {
      newStatus =
        'awaiting_validation';
    } else if (
      column?.type ===
      'member'
    ) {
      newStatus =
        task.status ===
        'planned'
          ? 'in_progress'
          : task.status;
    } else if (
      column?.type ===
      'backlog'
    ) {
      newStatus =
        'planned';
    }

    const movedTask:
      Task = {
      ...task,

      columnId:
        newColumnId,

      status:
        newStatus,

      assigneeId:
        column?.memberId ||
        task.assigneeId,
    };

    setTasks(
      (
        prev
      ) =>
        prev.map(
          (
            item
          ) =>
            item.id ===
            taskId
              ? movedTask
              : item
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .updateTask(
          movedTask
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao mover tarefa:',
              error
            );
          }
        );
    }
  };

  /*
   * =========================================
   * EQUIPE
   * =========================================
   */
 const addTeamMember = async (
  member: Omit<TeamMember, 'id'>
): Promise<void> => {
  if (!currentUser?.isAdmin) {
    throw new Error(
      'Somente um administrador pode cadastrar membros.'
    );
  }

  const version = sessionVersion.current;

  const name = member.name.trim();
  const email = member.email.trim().toLowerCase();
  const role = member.role.trim();

  if (!name || !email || !role) {
    throw new Error('Preencha nome, e-mail e função.');
  }

  if (
    teamMembers.some(
      item => item.email.trim().toLowerCase() === email
    )
  ) {
    throw new Error(
      'Já existe um membro com esse e-mail.'
    );
  }

  let savedMember: TeamMember;

  if (firebaseEnabled) {
    savedMember = await databaseService.createTeamMemberViaApi({
      name,
      email,
      role,
      avatar: member.avatar,
      isAdmin: member.isAdmin,
    });
  } else {
    savedMember = normalizeMember({
      ...member,
      id: generateId(),
      name,
      email,
      role,
      isActive: true,
    });

    await databaseService.saveTeamMember(savedMember);
  }

  // Não aplica uma resposta recebida após troca de sessão.
  if (sessionVersion.current !== version) return;

  setTeamMembers(prev =>
    sortTeamMembers([
      ...prev.filter(item => item.id !== savedMember.id),
      savedMember,
    ])
  );
};
const updateTeamMember = async (
  memberId: string,
  updates: Partial<TeamMember>
): Promise<void> => {
  const actor = currentUser;

  if (!actor) {
    throw new Error('Faça login para editar o cadastro.');
  }

  if (!actor.isAdmin && actor.id !== memberId) {
    throw new Error('Você não pode editar esse membro.');
  }

  const member = teamMembers.find(
    item => item.id === memberId
  );

  if (!member) {
    throw new Error('Membro não encontrado.');
  }

  const allowedFields = actor.isAdmin
    ? [
        'name',
        'role',
        'avatar',
        'avatarUrl',
        'isAdmin',
        'isActive',
      ]
    : ['name', 'avatar', 'avatarUrl'];

  const changedEntries = Object.entries(updates).filter(
    ([key, value]) =>
      value !== member[key as keyof TeamMember]
  );

  if (
    changedEntries.some(
      ([key]) => !allowedFields.includes(key)
    )
  ) {
    throw new Error(
      'Esta edição contém campos que não podem ser alterados por esse fluxo.'
    );
  }

  if (changedEntries.length === 0) return;

  const safeUpdates = Object.fromEntries(
    changedEntries
  ) as Partial<TeamMember>;

  const updatedMember = normalizeMember({
    ...member,
    ...safeUpdates,
    id: member.id,
    firebaseUid: member.firebaseUid,
  });

  const version = sessionVersion.current;

  if (firebaseEnabled && actor.isAdmin) {
    if (!member.firebaseUid) {
      throw new Error(
        'O cadastro não possui vínculo com o Authentication.'
      );
    }

    await databaseService.updateTeamMemberViaApi(
      member.firebaseUid,
      safeUpdates
    );
  } else {
    // Edição do próprio perfil por membro comum,
    // ou gravação em memória no modo demonstração.
    await databaseService.saveTeamMember(updatedMember);
  }

  // Não aplica uma resposta recebida após troca de sessão.
  if (sessionVersion.current !== version) return;

  setTeamMembers(prev =>
    sortTeamMembers(
      prev.map(item =>
        item.id === memberId ? updatedMember : item
      )
    )
  );
};
  const deleteTeamMember = async (
  memberId: string
): Promise<void> => {
  const actor = currentUser;

  if (!actor?.isAdmin) {
    throw new Error(
      'Somente um administrador pode remover membros.'
    );
  }

  if (actor.id === memberId) {
    throw new Error(
      'Você não pode excluir sua própria conta.'
    );
  }

  const member = teamMembers.find(
    item => item.id === memberId
  );

  if (!member) {
    throw new Error('Membro não encontrado.');
  }

  const version = sessionVersion.current;

  if (firebaseEnabled) {
    if (!member.firebaseUid) {
      throw new Error(
        'O cadastro não possui vínculo com o Authentication.'
      );
    }

    try {
      await databaseService.deleteTeamMemberViaApi(
        member.firebaseUid
      );
    } catch (error) {
      // Uma falha pode ocorrer depois de parte da operação.
      // Busca o estado atual antes de mostrar o erro.
      if (sessionVersion.current === version) {
        try {
          await applyRemoteData(actor, version);
        } catch (reloadError) {
          console.error(
            'Não foi possível atualizar os dados após a falha:',
            reloadError
          );

          throw new Error(
            (
              error instanceof Error
                ? error.message
                : 'Não foi possível confirmar a exclusão.'
            ) +
            ' A atualização da tela também falhou. Recarregue o aplicativo antes de continuar.'
          );
        }
      }

      throw error;
    }

    if (sessionVersion.current !== version) return;

    // Carrega as tarefas que a API realmente moveu.
    try {
      await applyRemoteData(actor, version);
    } catch (error) {
      console.error(
        'Exclusão concluída, mas a atualização da tela falhou:',
        error
      );

      throw new Error(
        'O membro foi excluído, mas a tela não pôde ser atualizada. Recarregue o aplicativo; não repita a exclusão.'
      );
    }

    return;
  }

  // Modo demonstração.
  const remainingMembers = teamMembers.filter(
    item => item.id !== memberId
  );

  const updatedTasks: Task[] = tasks.map(task =>
    task.assigneeId === memberId
      ? {
          ...task,
          assigneeId: null,
          columnId: 'backlog',
          status: 'planned',
        }
      : task
  );

  await databaseService.saveTeamMembers(remainingMembers);
  await databaseService.saveTasks(updatedTasks);

  if (sessionVersion.current !== version) return;

  setTeamMembers(sortTeamMembers(remainingMembers));
  setTasks(updatedTasks);
};

  /*
   * =========================================
   * CONTROLE DE NOTIFICAÇÕES
   * =========================================
   */
  const markNotificationRead = (
    notificationId:
      string
  ) => {
    const target =
      notifications.find(
        (
          notification
        ) =>
          notification.id ===
          notificationId
      );

    if (
      !target ||
      (
        target.userId !==
          currentUser?.id &&
        !currentUser?.isAdmin
      )
    ) {
      return;
    }

    const updatedNotification = {
      ...target,

      read:
        true,
    };

    setNotifications(
      (
        prev
      ) =>
        prev.map(
          (
            notification
          ) =>
            notification.id ===
            notificationId
              ? updatedNotification
              : notification
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveNotifications(
          [
            updatedNotification,
          ]
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao atualizar notificação:',
              error
            );
          }
        );
    }
  };

  const markAllNotificationsRead =
    () => {
      if (
        !currentUser
      ) {
        return;
      }

      const updatedNotifications =
        notifications.map(
          (
            notification
          ) =>
            notification.userId ===
            currentUser.id
              ? {
                  ...notification,

                  read:
                    true,
                }
              : notification
        );

      setNotifications(
        updatedNotifications
      );

      if (
        firebaseEnabled
      ) {
        void databaseService
          .saveNotifications(
            updatedNotifications.filter(
              (
                notification
              ) =>
                notification.userId ===
                currentUser.id
            )
          )
          .catch(
            (
              error
            ) => {
              console.error(
                'Erro ao atualizar notificações:',
                error
              );
            }
          );
      }
    };

  /*
   * =========================================
   * VALIDAÇÃO
   * =========================================
   */
  const validateTask = (
    taskId:
      string,

    status:
      | 'approved'
      | 'needs_adjustment',

    comment?:
      string
  ) => {
    if (
      !currentUser?.isAdmin
    ) {
      return;
    }

    const task =
      tasks.find(
        (
          item
        ) =>
          item.id ===
          taskId
      );

    if (
      !task
    ) {
      return;
    }

    const updatedTask:
      Task = {
      ...task,

      status:
        status ===
        'approved'
          ? 'approved'
          : 'in_progress',

      validationStatus:
        status,

      validationComment:
        comment,

      columnId:
        status ===
        'approved'
          ? 'completed'
          : task.columnId,
    };

    setTasks(
      (
        prev
      ) =>
        prev.map(
          (
            item
          ) =>
            item.id ===
            taskId
              ? updatedTask
              : item
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .updateTask(
          updatedTask
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao validar tarefa:',
              error
            );
          }
        );
    }

    if (
      task.assigneeId
    ) {
      addNotification({
        userId:
          task.assigneeId,

        message:
          status ===
          'approved'
            ? `Tarefa aprovada: ${task.title}`
            : `Tarefa devolvida para ajustes: ${task.title}`,

        type:
          'validation',

        taskId,

        read:
          false,
      });
    }
  };

  const getTasksByMember = (
    memberId:
      string
  ): Task[] => {
    return tasks.filter(
      (
        task
      ) =>
        task.assigneeId ===
        memberId
    );
  };

  const getTasksByStatus = (
    status:
      TaskStatus
  ): Task[] => {
    return tasks.filter(
      (
        task
      ) =>
        task.status ===
        status
    );
  };

  /*
   * =========================================
   * AUSÊNCIAS
   * =========================================
   */
  const addAbsenceEvent = (
    event:
      Omit<
        AbsenceEvent,
        'id' | 'createdAt'
      >
  ) => {
    if (
      !currentUser
    ) {
      return;
    }

    if (
      !currentUser.isAdmin &&
      currentUser.id !==
        event.memberId
    ) {
      return;
    }

    const newEvent:
      AbsenceEvent = {
      ...event,

      id:
        generateId(),

      createdAt:
        new Date(),
    };

    setAbsenceEvents(
      (
        prev
      ) => [
        ...prev,
        newEvent,
      ]
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveAbsence(
          newEvent
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao salvar ausência:',
              error
            );
          }
        );
    }
  };

  const updateAbsenceEvent = (
    eventId:
      string,

    updates:
      Partial<AbsenceEvent>
  ) => {
    const existingEvent =
      absenceEvents.find(
        (
          event
        ) =>
          event.id ===
          eventId
      );

    if (
      !existingEvent ||
      (
        !currentUser?.isAdmin &&
        currentUser?.id !==
          existingEvent.memberId
      )
    ) {
      return;
    }

    const updatedEvent = {
      ...existingEvent,
      ...updates,
    };

    setAbsenceEvents(
      (
        prev
      ) =>
        prev.map(
          (
            event
          ) =>
            event.id ===
            eventId
              ? updatedEvent
              : event
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .saveAbsence(
          updatedEvent
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao atualizar ausência:',
              error
            );
          }
        );
    }
  };

  const deleteAbsenceEvent = (
    eventId:
      string
  ) => {
    const existingEvent =
      absenceEvents.find(
        (
          event
        ) =>
          event.id ===
          eventId
      );

    if (
      !existingEvent ||
      (
        !currentUser?.isAdmin &&
        currentUser?.id !==
          existingEvent.memberId
      )
    ) {
      return;
    }

    setAbsenceEvents(
      (
        prev
      ) =>
        prev.filter(
          (
            event
          ) =>
            event.id !==
            eventId
        )
    );

    if (
      firebaseEnabled
    ) {
      void databaseService
        .deleteAbsence(
          eventId
        )
        .catch(
          (
            error
          ) => {
            console.error(
              'Erro ao remover ausência:',
              error
            );
          }
        );
    }
  };

  const getAbsencesByDate = (
    date:
      Date
  ): AbsenceEvent[] => {
    return absenceEvents.filter(
      (
        event
      ) => {
        const eventStart =
          new Date(
            event.startDate
          );

        const eventEnd =
          new Date(
            event.endDate
          );

        const checkDate =
          new Date(
            date
          );

        eventStart.setHours(
          0,
          0,
          0,
          0
        );

        eventEnd.setHours(
          23,
          59,
          59,
          999
        );

        checkDate.setHours(
          12,
          0,
          0,
          0
        );

        return (
          checkDate >=
            eventStart &&
          checkDate <=
            eventEnd
        );
      }
    );
  };

  const getAbsencesByMember = (
    memberId:
      string
  ): AbsenceEvent[] => {
    return absenceEvents.filter(
      (
        event
      ) =>
        event.memberId ===
        memberId
    );
  };

  /*
   * =========================================
   * PERMISSÕES
   * =========================================
   */
  const isAdmin =
    (): boolean => {
      return (
        currentUser?.isAdmin ===
        true
      );
    };

  const canEditTask = (
    task:
      Task
  ): boolean => {
    if (
      currentUser?.isAdmin
    ) {
      return true;
    }

    if (
      !currentUser
    ) {
      return false;
    }

    const ownsTask =
      task.assigneeId ===
        currentUser.id ||
      task.createdBy ===
        currentUser.id;

    return (
      ownsTask &&
      task.status !==
        'approved'
    );
  };

  /*
   * =========================================
   * IMPORTAÇÃO
   * =========================================
   */
  const importData = (
    data: {
      tasks:
        Task[];

      teamMembers:
        TeamMember[];

      absences:
        AbsenceEvent[];

      notifications:
        Notification[];
    }
  ) => {
    if (
      !currentUser?.isAdmin
    ) {
      return;
    }

    const normalizedMembers =
      sortTeamMembers(
        data.teamMembers.map(
          normalizeMember
        )
      );

    const normalizedTasks =
      data.tasks.map(
        (
          task
        ) => ({
          ...task,

          dueDate:
            task.dueDate
              ? new Date(
                  task.dueDate
                )
              : null,

          createdAt:
            new Date(
              task.createdAt
            ),

          startDate:
            task.startDate
              ? new Date(
                  task.startDate
                )
              : null,

          comments:
            task.comments.map(
              (
                comment
              ) => ({
                ...comment,

                createdAt:
                  new Date(
                    comment.createdAt
                  ),
              })
            ),
        })
      );

    const normalizedAbsences =
      data.absences.map(
        (
          absence
        ) => ({
          ...absence,

          startDate:
            new Date(
              absence.startDate
            ),

          endDate:
            new Date(
              absence.endDate
            ),

          createdAt:
            new Date(
              absence.createdAt
            ),
        })
      );

    const normalizedNotifications =
      data.notifications.map(
        (
          notification
        ) => ({
          ...notification,

          createdAt:
            new Date(
              notification.createdAt
            ),
        })
      );

    setTasks(
      normalizedTasks
    );

    setTeamMembers(
      normalizedMembers
    );

    setAbsenceEvents(
      normalizedAbsences
    );

    setNotifications(
      normalizedNotifications
    );

    if (
      firebaseEnabled
    ) {
      void Promise.all([
        databaseService.saveTasks(
          normalizedTasks
        ),

        databaseService.saveTeamMembers(
          normalizedMembers
        ),

        Promise.all(
          normalizedAbsences.map(
            (
              absence
            ) =>
              databaseService.saveAbsence(
                absence
              )
          )
        ),

        databaseService.saveNotifications(
          normalizedNotifications
        ),
      ]).catch(
        (
          error
        ) => {
          console.error(
            'Erro ao importar dados para o Firebase:',
            error
          );
        }
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        teamMembers,
        columns,
        notifications,
        absenceEvents,
        currentUser,
        weekInfo,
        isLoggedIn,
        authLoading,
        authError,
        firebaseEnabled,

        login,
        register,
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

        absences:
          absenceEvents,

        importData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context =
    useContext(
      AppContext
    );

  if (
    context ===
    undefined
  ) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
}