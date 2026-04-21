import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task } from '../types';
import {
  CheckCircle,
  MessageSquare,
  Clock,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ShieldCheck,
  Lock,
  ShieldX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';

export function ValidationPage() {
  const { tasks, teamMembers, validateTask, isAdmin } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');

  const userIsAdmin = isAdmin();

  const pendingTasks = tasks.filter(t => t.status === 'awaiting_validation');
  const recentlyValidated = tasks
    .filter(
      t =>
        t.validationStatus &&
        (t.status === 'approved' || t.validationStatus === 'needs_adjustment')
    )
    .slice(0, 5);

  const handleValidate = (
    taskId: string,
    status: 'approved' | 'needs_adjustment'
  ) => {
    if (!userIsAdmin) return;
    validateTask(taskId, status, comment || undefined);
    setSelectedTask(null);
    setComment('');
  };

  const getAssignee = (assigneeId: string | null) => {
    return teamMembers.find(m => m.id === assigneeId);
  };

  if (!userIsAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-lg sm:p-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            Acesso restrito
          </h1>

          <p className="mb-5 text-gray-600">
            Apenas <strong>administradores</strong> podem validar tarefas concluídas.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 text-left text-amber-700">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                Entre em contato com um administrador para validar suas tarefas.
              </span>
            </div>
          </div>

          {pendingTasks.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Tarefas aguardando validação:
              </h3>

              <div className="space-y-2">
                {pendingTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm"
                  >
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-700">{task.title}</span>
                  </div>
                ))}

                {pendingTasks.length > 3 && (
                  <p className="text-xs text-gray-500">
                    E mais {pendingTasks.length - 3} tarefa(s)...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            Validação de Tarefas
          </h1>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Revise e aprove as tarefas concluídas pela equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Pendentes */}
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-yellow-50 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <h2 className="font-semibold text-gray-800">
                  Aguardando validação
                </h2>
                <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  {pendingTasks.length}
                </span>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center sm:p-10">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                <p className="font-medium text-gray-600">Tudo em dia!</p>
                <p className="mt-1 text-sm text-gray-400">
                  Não há tarefas pendentes de validação.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingTasks.map(task => {
                  const assignee = getAssignee(task.assigneeId);
                  const completedChecklist = task.checklist.filter(
                    i => i.completed
                  ).length;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'cursor-pointer p-4 transition hover:bg-gray-50 sm:p-5',
                        selectedTask?.id === task.id && 'bg-blue-50'
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-800">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {assignee && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                                  {assignee.avatarUrl ? (
                                    <img
                                      src={assignee.avatarUrl}
                                      alt={assignee.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs">{assignee.avatar}</span>
                                  )}
                                </div>
                                <span className="truncate">{assignee.name}</span>
                              </div>
                            )}

                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(new Date(task.dueDate), 'dd/MM/yyyy', {
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                            )}

                            {task.checklist.length > 0 && (
                              <div className="flex items-center gap-1">
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span>
                                  {completedChecklist}/{task.checklist.length}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidate(task.id, 'approved');
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition hover:bg-green-100"
                            title="Aprovar"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 transition hover:bg-yellow-100"
                            title="Revisar"
                          >
                            <MessageSquare className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Formulário */}
          {selectedTask && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-blue-50 p-4 sm:p-5">
                <h2 className="font-semibold text-gray-800">Validar tarefa</h2>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {selectedTask.title}
                  </h3>

                  {selectedTask.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedTask.description}
                    </p>
                  )}
                </div>

                {selectedTask.checklist.length > 0 && (
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Checklist
                    </p>

                    <div className="space-y-2">
                      {selectedTask.checklist.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckSquare
                            className={cn(
                              'h-4 w-4',
                              item.completed
                                ? 'text-green-500'
                                : 'text-gray-300'
                            )}
                          />
                          <span
                            className={cn(
                              item.completed
                                ? 'text-gray-600'
                                : 'text-gray-400'
                            )}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Comentário (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicione um comentário sobre a validação..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => handleValidate(selectedTask.id, 'approved')}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>

                  <button
                    onClick={() =>
                      handleValidate(selectedTask.id, 'needs_adjustment')
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-2.5 text-white transition hover:bg-yellow-600"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Ajustar
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setComment('');
                  }}
                  className="w-full text-sm text-gray-500 transition hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Recentes */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <h2 className="font-semibold text-gray-800">
                Validações recentes
              </h2>
            </div>

            {recentlyValidated.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                Nenhuma validação recente
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentlyValidated.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-4">
                    {task.validationStatus === 'approved' ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.validationStatus === 'approved'
                          ? 'Aprovada'
                          : 'Devolvida para ajustes'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}