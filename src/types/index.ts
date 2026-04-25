export type TaskStatus =
  | 'planned'
  | 'in_progress'
  | 'awaiting_validation'
  | 'completed'
  | 'approved';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'document';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  status: TaskStatus;
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  columnId: string;
  createdAt: Date;
  createdBy: string;
  validationComment?: string;
  validationStatus?: 'approved' | 'needs_adjustment';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarUrl?: string;
  email: string;
  isAdmin: boolean;
  firebaseUid?: string;
  isActive?: boolean;
}

export interface Column {
  id: string;
  title: string;
  type: 'backlog' | 'member' | 'completed';
  memberId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'assignment' | 'deadline' | 'validation' | 'comment';
  taskId?: string;
  read: boolean;
  createdAt: Date;
}

export interface WeekInfo {
  startDate: Date;
  endDate: Date;
  title: string;
}

/* 🔥 ATUALIZAÇÃO AQUI */
export type AbsenceType =
  | 'medical'
  | 'medical_leave'
  | 'internal_meeting'
  | 'external_meeting'
  | 'birthday'
  | 'vacation'
  | 'tre'
  | 'personal'
  | 'other';

export interface AbsenceEvent {
  id: string;
  memberId: string;
  type: AbsenceType;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  createdAt: Date;
}