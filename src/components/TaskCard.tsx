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

// Configuração das etiquetas de status com cores
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'planned':
      return {
        bgColor: 'bg-slate-500',
        lightBg: 'bg-slate-100',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-400',
        label: 'Planejada',
        icon: Circle,
        stripColor: 'bg-slate-400'
      };
    case 'in_progress':
      return {
        bgColor: 'bg-yellow-500',
        lightBg: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-400',
        label: 'Em Andamento',
        icon: Loader2,
        stripColor: 'bg-yellow-400'
      };
    case 'awaiting_validation':
      return {
        bgColor: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-400',
        label: 'Aguardando Validação',
        icon: Timer,
        stripColor: 'bg-orange-400'
      };
    case 'completed':
      return {
        bgColor: 'bg-green-500',
        lightBg: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-400',
        label: 'Concluída',
        icon: CheckCircle2,
        stripColor: 'bg-green-500'
      };
    case 'approved':
      return {
        bgColor: 'bg-emerald-600',
        lightBg: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-400',
        label: 'Aprovada ✓',
        icon: Award,
        stripColor: 'bg-emerald-600'
      };
    default:
      return {
        bgColor: 'bg-gray-500',
        lightBg: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-400',
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

  // Verificar se está atrasada
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && 
    task.status !== 'completed' && task.status !== 'approved';

  const getStartDateInfo = () => {
    if (!task.startDate) return null;
    
    const date = new Date(task.startDate);
    const text = format(date, 'dd/MM', { locale: ptBR });
    
    return { text };
  };

  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    
    const date = new Date(task.dueDate);
    const overdue = isPast(date) && task.status !== 'completed' && task.status !== 'approved';
    const isDueToday = isToday(date);
    const isDueTomorrow = isTomorrow(date);

    let text = format(date, 'dd/MM', { locale: ptBR });
    let className = 'text-gray-500';
    let Icon = Calendar;

    if (overdue) {
      text = 'Atrasada';
      className = 'text-red-600 bg-red-50';
      Icon = AlertCircle;
    } else if (isDueToday) {
      text = 'Hoje';
      className = 'text-orange-600 bg-orange-50';
      Icon = Clock;
    } else if (isDueTomorrow) {
      text = 'Amanhã';
      className = 'text-yellow-600 bg-yellow-50';
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
        "bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all overflow-hidden group",
        "w-full min-h-[100px]",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isOverdue && "ring-2 ring-red-300"
      )}
    >
      {/* Barra de cor no topo - Etiqueta de Status */}
      <div className={cn("h-2 w-full", statusConfig.stripColor)} />
      
      <div className="p-2.5 relative">
        {/* Botão Excluir - apenas para admin */}
        {userIsAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Deseja realmente excluir esta tarefa?')) {
                deleteTask(task.id);
              }
            }}
            className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Excluir tarefa"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Etiqueta de Status Principal */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <div className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border",
            statusConfig.lightBg,
            statusConfig.textColor,
            statusConfig.borderColor
          )}>
            <StatusIcon className={cn(
              "w-2.5 h-2.5",
              task.status === 'in_progress' && "animate-spin"
            )} />
            <span className="uppercase tracking-wide">{statusConfig.label}</span>
          </div>
          
          {/* Indicador de Atrasada */}
          {isOverdue && (
            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-bold animate-pulse">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>ATRASADA</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-800 text-[11px] mb-1 line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-[9px] text-gray-500 mb-2 line-clamp-1">
            {task.description}
          </p>
        )}

        {/* Datas: Início → Prazo */}
        {(startDateInfo || dueDateInfo) && (
          <div className="flex items-center gap-1 mb-2 text-[9px]">
            {startDateInfo && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                <Calendar className="w-2.5 h-2.5" />
                <span>Início: {startDateInfo.text}</span>
              </div>
            )}
            {startDateInfo && dueDateInfo && (
              <span className="text-gray-400">→</span>
            )}
            {dueDateInfo && (
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium",
                dueDateInfo.className || "bg-red-50 text-red-700"
              )}>
                <dueDateInfo.Icon className="w-2.5 h-2.5" />
                <span>Prazo: {dueDateInfo.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Checklist */}
          {totalChecklist > 0 && (
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium",
              completedChecklist === totalChecklist 
                ? "text-green-600 bg-green-50" 
                : "text-gray-500 bg-gray-100"
            )}>
              <CheckSquare className="w-2.5 h-2.5" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-0.5 text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-medium">
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-medium">
              <Paperclip className="w-2.5 h-2.5" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee + Lock indicator */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          {assignee && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-[10px] shadow-sm border border-gray-200 overflow-hidden">
                {assignee.avatarUrl ? (
                  <img src={assignee.avatarUrl} alt={assignee.name} className="w-full h-full object-cover" />
                ) : (
                  assignee.avatar
                )}
              </div>
              <span className="text-[9px] text-gray-600 font-medium truncate">{assignee.name}</span>
            </div>
          )}
          {!userIsAdmin && (
            <div className="flex items-center gap-0.5 text-gray-400" title="Apenas administradores podem editar">
              <Lock className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-2 bg-gray-300 w-full" />
      <div className="p-3">
        <div className="h-6 bg-gray-200 rounded-full w-24 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded w-12" />
          <div className="h-5 bg-gray-200 rounded w-8" />
        </div>
      </div>
    </div>
  );
}
