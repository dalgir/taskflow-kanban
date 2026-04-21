import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle,
  Circle,
  Loader2,
  CheckCircle2,
  Timer,
  Award,
  Lock,
  X
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'planned':
      return {
        bgColor: 'bg-slate-500',
        lightBg: 'bg-slate-100',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-300',
        label: 'Planejada',
        icon: Circle,
        stripColor: 'bg-slate-400'
      };
    case 'in_progress':
      return {
        bgColor: 'bg-yellow-500',
        lightBg: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        label: 'Em Andamento',
        icon: Loader2,
        stripColor: 'bg-yellow-400'
      };
    case 'awaiting_validation':
      return {
        bgColor: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        label: 'Aguardando Validação',
        icon: Timer,
        stripColor: 'bg-orange-400'
      };
    case 'completed':
      return {
        bgColor: 'bg-green-500',
        lightBg: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        label: 'Concluída',
        icon: CheckCircle2,
        stripColor: 'bg-green-500'
      };
    case 'approved':
      return {
        bgColor: 'bg-emerald-600',
        lightBg: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300',
        label: 'Aprovada',
        icon: Award,
        stripColor: 'bg-emerald-600'
      };
    default:
      return {
        bgColor: 'bg-gray-500',
        lightBg: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        label: 'Pendente',
        icon: Circle,
        stripColor: 'bg-gray-400'
      };
  }
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { teamMembers, isAdmin, deleteTask } = useApp();
  const assignee = teamMembers.find(m => m.id === task.assigneeId);
  const userIsAdmin = isAdmin();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedChecklist = task.checklist.filter(item => item.completed).length;
  const totalChecklist = task.checklist.length;

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    task.status !== 'completed' &&
    task.status !== 'approved';

  const getStartDateInfo = () => {
    if (!task.startDate) return null;

    const date = new Date(task.startDate);
    const text = format(date, 'dd/MM', { locale: ptBR });

    return { text };
  };

  const getDueDateInfo = () => {
    if (!task.dueDate) return null;

    const date = new Date(task.dueDate);
    const overdue =
      isPast(date) &&
      task.status !== 'completed' &&
      task.status !== 'approved';
    const isDueToday = isToday(date);
    const isDueTomorrow = isTomorrow(date);

    let text = format(date, 'dd/MM', { locale: ptBR });
    let className = 'text-gray-600 bg-gray-100';
    let Icon = Calendar;

    if (overdue) {
      text = 'Atrasada';
      className = 'text-red-700 bg-red-50';
      Icon = AlertCircle;
    } else if (isDueToday) {
      text = 'Hoje';
      className = 'text-orange-700 bg-orange-50';
      Icon = Clock;
    } else if (isDueTomorrow) {
      text = 'Amanhã';
      className = 'text-yellow-700 bg-yellow-50';
      Icon = Clock;
    }

    return { text, className, Icon };
  };

  const startDateInfo = getStartDateInfo();
  const dueDateInfo = getDueDateInfo();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200',
        'min-h-[132px] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]',
        isDragging && 'rotate-2 opacity-60 shadow-xl',
        isOverdue && 'ring-2 ring-red-200 border-red-200'
      )}
    >
      {/* Barra superior de status */}
      <div className={cn('h-1.5 w-full', statusConfig.stripColor)} />

      {/* Botão excluir */}
      {userIsAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Deseja realmente excluir esta tarefa?')) {
              deleteTask(task.id);
            }
          }}
          className={cn(
            'absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition',
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-600'
          )}
          title="Excluir tarefa"
          aria-label="Excluir tarefa"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="p-3.5 sm:p-4">
        {/* Status */}
        <div className="mb-2 flex items-center gap-2 flex-wrap pr-10">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] sm:text-[11px] font-semibold',
              statusConfig.lightBg,
              statusConfig.textColor,
              statusConfig.borderColor
            )}
          >
            <StatusIcon
              className={cn(
                'h-3.5 w-3.5',
                task.status === 'in_progress' && 'animate-spin'
              )}
            />
            <span className="leading-none">{statusConfig.label}</span>
          </div>

          {isOverdue && (
            <div className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-[10px] font-semibold text-white">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Atrasada</span>
            </div>
          )}
        </div>

        {/* Título */}
        <h4 className="mb-1.5 line-clamp-2 text-sm sm:text-[15px] font-semibold leading-5 text-gray-800">
          {task.title}
        </h4>

        {/* Descrição */}
        {task.description && (
          <p className="mb-3 line-clamp-2 text-xs sm:text-[13px] leading-4 text-gray-500">
            {task.description}
          </p>
        )}

        {/* Datas */}
        {(startDateInfo || dueDateInfo) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {startDateInfo && (
              <div className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 font-medium text-green-700">
                <Calendar className="h-3.5 w-3.5" />
                <span>Início: {startDateInfo.text}</span>
              </div>
            )}

            {dueDateInfo && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium',
                  dueDateInfo.className
                )}
              >
                <dueDateInfo.Icon className="h-3.5 w-3.5" />
                <span>Prazo: {dueDateInfo.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-2">
          {totalChecklist > 0 && (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium',
                completedChecklist === totalChecklist
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}

          {task.comments.length > 0 && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {task.attachments.length > 0 && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          {assignee ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-blue-100 to-indigo-100 text-xs shadow-sm">
                {assignee.avatarUrl ? (
                  <img
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  assignee.avatar
                )}
              </div>

              <span className="truncate text-xs sm:text-[13px] font-medium text-gray-700">
                {assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Sem responsável</span>
          )}

          {!userIsAdmin && (
            <div
              className="inline-flex items-center gap-1 text-gray-400"
              title="Apenas administradores podem editar"
            >
              <Lock className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="h-1.5 w-full bg-gray-300" />
      <div className="p-4">
        <div className="mb-3 h-6 w-28 rounded-full bg-gray-200" />
        <div className="mb-2 h-4 w-full rounded bg-gray-200" />
        <div className="mb-3 h-4 w-4/5 rounded bg-gray-200" />
        <div className="mb-4 flex gap-2">
          <div className="h-7 w-16 rounded-lg bg-gray-200" />
          <div className="h-7 w-12 rounded-lg bg-gray-200" />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
          <div className="h-3 w-3 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}