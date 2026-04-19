import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { AbsenceEvent, Notification, Task, TeamMember } from '../types';

export interface AppData {
  tasks: Task[];
  teamMembers: TeamMember[];
  absences: AbsenceEvent[];
  notifications: Notification[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const serializeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }

  return value;
};

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const reviveTask = (task: Task): Task => ({
  ...task,
  startDate: toDateOrNull(task.startDate),
  dueDate: toDateOrNull(task.dueDate),
  createdAt: toDateOrNull(task.createdAt) ?? new Date(),
  comments: Array.isArray(task.comments)
    ? task.comments.map(comment => ({
        ...comment,
        createdAt: toDateOrNull(comment.createdAt) ?? new Date(),
      }))
    : [],
});

const reviveAbsence = (absence: AbsenceEvent): AbsenceEvent => ({
  ...absence,
  startDate: toDateOrNull(absence.startDate) ?? new Date(),
  endDate: toDateOrNull(absence.endDate) ?? new Date(),
  createdAt: toDateOrNull(absence.createdAt) ?? new Date(),
});

const reviveNotification = (notification: Notification): Notification => ({
  ...notification,
  createdAt: toDateOrNull(notification.createdAt) ?? new Date(),
});

const reviveMember = (member: TeamMember): TeamMember => ({
  ...member,
  email: member.email.trim().toLowerCase(),
  isActive: member.isActive !== false,
});

const normalizeImportedData = (data: AppData): AppData => ({
  tasks: Array.isArray(data.tasks) ? data.tasks.map(reviveTask) : [],
  teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers.map(reviveMember) : [],
  absences: Array.isArray(data.absences) ? data.absences.map(reviveAbsence) : [],
  notifications: Array.isArray(data.notifications) ? data.notifications.map(reviveNotification) : [],
});

class DatabaseService {
  private useFirebase: boolean;

  constructor() {
    this.useFirebase = isFirebaseConfigured() && db !== null;
    console.log(this.useFirebase ? '🔥 Usando Firebase' : '💾 Usando LocalStorage');
  }

  private async saveToFirebase<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
    if (!db) return;
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, serializeValue(data) as Record<string, unknown>, { merge: true });
  }

  private async deleteFromFirebase(collectionName: string, id: string): Promise<void> {
    if (!db) return;
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  private async loadFromFirebase<T>(collectionName: string, reviver?: (value: T) => T): Promise<T[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, collectionName));
    const items = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() } as T));
    return reviver ? items.map(reviver) : items;
  }

  subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    reviver?: (value: T) => T
  ): Unsubscribe | null {
    if (!this.useFirebase || !db) return null;

    return onSnapshot(collection(db, collectionName), snapshot => {
      const data = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() } as T));
      callback(reviver ? data.map(reviver) : data);
    });
  }

  private saveToLocalStorage(key: string, data: unknown): void {
    localStorage.setItem(`taskflow_${key}`, JSON.stringify(serializeValue(data)));
  }

  private loadFromLocalStorage<T>(key: string, reviver?: (value: T) => T): T[] | null {
    const data = localStorage.getItem(`taskflow_${key}`);
    if (!data) return null;

    const parsed = JSON.parse(data) as T[];
    return reviver ? parsed.map(reviver) : parsed;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (this.useFirebase) {
      for (const task of tasks) {
        await this.saveToFirebase('tasks', reviveTask(task));
      }
      return;
    }

    this.saveToLocalStorage('tasks', tasks.map(reviveTask));
  }

  async saveTask(task: Task): Promise<void> {
    const normalizedTask = reviveTask(task);

    if (this.useFirebase) {
      await this.saveToFirebase('tasks', normalizedTask);
      return;
    }

    const tasks = this.loadFromLocalStorage<Task>('tasks', reviveTask) || [];
    const index = tasks.findIndex(item => item.id === normalizedTask.id);
    if (index >= 0) {
      tasks[index] = normalizedTask;
    } else {
      tasks.push(normalizedTask);
    }
    this.saveToLocalStorage('tasks', tasks);
  }

  async updateTask(task: Task): Promise<void> {
    await this.saveTask(task);
  }

  async deleteTask(taskId: string): Promise<void> {
    if (this.useFirebase) {
      await this.deleteFromFirebase('tasks', taskId);
      return;
    }

    const tasks = this.loadFromLocalStorage<Task>('tasks', reviveTask) || [];
    this.saveToLocalStorage('tasks', tasks.filter(task => task.id !== taskId));
  }

  async loadTasks(): Promise<Task[]> {
    if (this.useFirebase) {
      return this.loadFromFirebase<Task>('tasks', reviveTask);
    }
    return this.loadFromLocalStorage<Task>('tasks', reviveTask) || [];
  }

  async saveTeamMembers(members: TeamMember[]): Promise<void> {
    if (this.useFirebase) {
      for (const member of members) {
        await this.saveToFirebase('teamMembers', reviveMember(member));
      }
      return;
    }

    this.saveToLocalStorage('teamMembers', members.map(reviveMember));
  }

  async saveTeamMember(member: TeamMember): Promise<void> {
    const normalizedMember = reviveMember(member);

    if (this.useFirebase) {
      await this.saveToFirebase('teamMembers', normalizedMember);
      return;
    }

    const members = this.loadFromLocalStorage<TeamMember>('teamMembers', reviveMember) || [];
    const index = members.findIndex(item => item.id === normalizedMember.id);
    if (index >= 0) {
      members[index] = normalizedMember;
    } else {
      members.push(normalizedMember);
    }
    this.saveToLocalStorage('teamMembers', members);
  }

  async deleteTeamMember(memberId: string): Promise<void> {
    if (this.useFirebase) {
      await this.deleteFromFirebase('teamMembers', memberId);
      return;
    }

    const members = this.loadFromLocalStorage<TeamMember>('teamMembers', reviveMember) || [];
    this.saveToLocalStorage('teamMembers', members.filter(member => member.id !== memberId));
  }

  async loadTeamMembers(): Promise<TeamMember[]> {
    if (this.useFirebase) {
      return this.loadFromFirebase<TeamMember>('teamMembers', reviveMember);
    }
    return this.loadFromLocalStorage<TeamMember>('teamMembers', reviveMember) || [];
  }

  async saveAbsence(absence: AbsenceEvent): Promise<void> {
    const normalizedAbsence = reviveAbsence(absence);

    if (this.useFirebase) {
      await this.saveToFirebase('absences', normalizedAbsence);
      return;
    }

    const absences = this.loadFromLocalStorage<AbsenceEvent>('absences', reviveAbsence) || [];
    const index = absences.findIndex(item => item.id === normalizedAbsence.id);
    if (index >= 0) {
      absences[index] = normalizedAbsence;
    } else {
      absences.push(normalizedAbsence);
    }
    this.saveToLocalStorage('absences', absences);
  }

  async deleteAbsence(absenceId: string): Promise<void> {
    if (this.useFirebase) {
      await this.deleteFromFirebase('absences', absenceId);
      return;
    }

    const absences = this.loadFromLocalStorage<AbsenceEvent>('absences', reviveAbsence) || [];
    this.saveToLocalStorage('absences', absences.filter(absence => absence.id !== absenceId));
  }

  async loadAbsences(): Promise<AbsenceEvent[]> {
    if (this.useFirebase) {
      return this.loadFromFirebase<AbsenceEvent>('absences', reviveAbsence);
    }
    return this.loadFromLocalStorage<AbsenceEvent>('absences', reviveAbsence) || [];
  }

  async saveNotifications(notifications: Notification[]): Promise<void> {
    const normalizedNotifications = notifications.map(reviveNotification);

    if (this.useFirebase) {
      for (const notification of normalizedNotifications) {
        await this.saveToFirebase('notifications', notification);
      }
      return;
    }

    const current = this.loadFromLocalStorage<Notification>('notifications', reviveNotification) || [];
    const next = [...current];

    for (const notification of normalizedNotifications) {
      const index = next.findIndex(item => item.id === notification.id);
      if (index >= 0) {
        next[index] = notification;
      } else {
        next.push(notification);
      }
    }

    this.saveToLocalStorage('notifications', next);
  }

  async loadNotifications(): Promise<Notification[]> {
    if (this.useFirebase) {
      return this.loadFromFirebase<Notification>('notifications', reviveNotification);
    }
    return this.loadFromLocalStorage<Notification>('notifications', reviveNotification) || [];
  }

  exportAllData(data: AppData): string {
    return JSON.stringify(serializeValue(normalizeImportedData(data)), null, 2);
  }

  importAllData(jsonString: string): AppData | null {
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      if (!isRecord(parsed)) {
        throw new Error('Estrutura inválida de backup.');
      }

      const candidate: AppData = {
        tasks: Array.isArray(parsed.tasks) ? (parsed.tasks as Task[]) : [],
        teamMembers: Array.isArray(parsed.teamMembers) ? (parsed.teamMembers as TeamMember[]) : [],
        absences: Array.isArray(parsed.absences) ? (parsed.absences as AbsenceEvent[]) : [],
        notifications: Array.isArray(parsed.notifications) ? (parsed.notifications as Notification[]) : [],
      };

      return normalizeImportedData(candidate);
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return null;
    }
  }

  downloadBackup(data: AppData, filename: string = 'taskflow_backup.json'): void {
    const jsonString = this.exportAllData(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  isUsingFirebase(): boolean {
    return this.useFirebase;
  }
}

export const databaseService = new DatabaseService();
