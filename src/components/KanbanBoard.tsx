import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useApp } from '../contexts/AppContext';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Task, Column } from '../types';
import {
  Plus,
  Circle,
  Loader2,
  Timer,
  CheckCircle2,
  Award,
  AlertCircle,
  UserX,
  Layout,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';

// Legenda de Status
const statusLegend = [
  { color: 'bg-slate-400', label: 'Planejada', icon: Circle },
  { color: 'bg-yellow-400', label: 'Em Andamento', icon: Loader2 },
  { color: 'bg-orange-400', label: 'Aguardando Validação', icon: Timer },
  { color: 'bg-green-500', label: 'Concluída', icon: CheckCircle2 },
  { color: 'bg-emerald-600', label: 'Aprovada', icon: Award },
  { color: 'bg-red-500', label: 'Atrasada', icon: AlertCircle },
];

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  colorIndex?: number;
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  colorIndex = 0
}: KanbanColumnProps) {
  const { teamMembers, getAbsencesByDate } = useApp();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const member = column.memberId
    ? teamMembers.find(m => m.id === column.memberId)
    : null;

  const today = new Date();
  const memberAbsences = member
    ? getAbsencesByDate(today).filter(a => a.memberId === member.id)
    : [];
  const isAbsent = memberAbsences.length > 0;
  const absenceInfo = memberAbsences[0];

  const colors = [
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
  ];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-[85vw] sm:w-[360px] lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border p-4 flex flex-col',
        'max-h-[calc(100dvh-260px)] sm:max-h-[calc(100dvh-280px)]',
        column.type === 'completed'
          ? 'border-green-200 bg-green-50/30'
          : isAbsent
          ? 'border-red-300 bg-red-50/30'
          : 'border-gray-200',
        isOver && 'ring-2 ring-blue-400 bg-blue-50/50'
      )}
    >
      {/* Column Header */}
      <div className="flex items-start gap-3 mb-4 flex-shrink-0">
        {column.type === 'backlog' ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Layout className="w-5 h-5 text-white" />
          </div>
        ) : column.type === 'completed' ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        ) : member ? (
          <div className={`relative flex-shrink-0 ${isAbsent ? 'opacity-60' : ''}`}>
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                className={`w-10 h-10 rounded-xl object-cover ${isAbsent ? 'grayscale' : ''}`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[colorIndex % colors.length]} flex items-center justify-center`}
              >
                <span className="text-white font-semibold text-sm">
                  {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
            )}
            {isAbsent && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <UserX className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 truncate">{column.title}</h3>
            {member?.isAdmin && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0">
                Admin
              </span>
            )}
          </div>

          {column.type === 'backlog' && (
            <p className="text-xs text-gray-500">Tarefas planejadas</p>
          )}

          {column.type === 'completed' && (
            <p className="text-xs text-gray-500">Tarefas finalizadas</p>
          )}

          {member && !isAbsent && (
            <p className="text-xs text-gray-500 truncate">{member.role}</p>
          )}

          {member && isAbsent && absenceInfo && (
            <p className="text-xs text-red-600 font-medium truncate">
              {absenceInfo.title}
            </p>
          )}
        </div>

        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full flex-shrink-0',
            column.type === 'backlog'
              ? 'bg-blue-100 text-blue-700'
              : column.type === 'completed'
              ? 'bg-green-100 text-green-700'
              : isAbsent
              ? 'bg-red-100 text-red-700'
              : 'bg-purple-100 text-purple-700'
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[120px]">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center text-gray-400 text-sm">
            <p>Nenhuma tarefa</p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      {column.type !== 'completed' && (
        <button
          onClick={() => onAddTask(column.id)}
          className={cn(
            'mt-3 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl transition-all flex-shrink-0 min-h-[44px]',
            column.type === 'backlog'
              ? 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50'
              : 'border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50'
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Adicionar</span>
        </button>
      )}
    </div>
  );
}

export function KanbanBoard() {
  const { tasks, columns, moveTask } = useApp();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    let targetColumnId = overId;

    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      targetColumnId = overTask.columnId;
    }

    const isColumn = columns.some(c => c.id === targetColumnId);
    if (!isColumn) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.columnId !== targetColumnId) {
      moveTask(taskId, targetColumnId);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalMode('view');
  };

  const handleAddTask = (columnId: string) => {
    setCreateColumnId(columnId);
    setSelectedTask(null);
    setModalMode('create');
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setCreateColumnId(null);
  };

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.columnId === columnId);
  };

  return (
    <div className="space-y-4">
      {/* Kanban Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
            <p className="text-sm text-gray-500">Total de Tarefas</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
            <p className="text-sm text-gray-500">Em Andamento</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'awaiting_validation').length}
            </p>
            <p className="text-sm text-gray-500">Aguardando Validação</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(
                t => t.status === 'completed' || t.status === 'approved'
              ).length}
            </p>
            <p className="text-sm text-gray-500">Concluídas</p>
          </div>
        </div>

        {/* Legenda de Status */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-700">
              📋 Legenda de Status
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {statusLegend.map((status) => {
              const Icon = status.icon;
              return (
                <div key={status.label} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-full', status.color)} />
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto overflow-y-hidden pb-2">
            <div className="flex gap-4 min-w-max items-start">
              {columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksForColumn(column.id)}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleAddTask}
                  colorIndex={column.type === 'member' ? index - 1 : 0}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-2 opacity-95">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      {(selectedTask || createColumnId) && (
        <TaskModal
          task={selectedTask || undefined}
          columnId={createColumnId || undefined}
          mode={modalMode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}