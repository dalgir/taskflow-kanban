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
  const recentlyValidated = tasks.filter(t => 
    t.validationStatus && (t.status === 'approved' || t.validationStatus === 'needs_adjustment')
  ).slice(0, 5);

  const handleValidate = (taskId: string, status: 'approved' | 'needs_adjustment') => {
    if (!userIsAdmin) return;
    validateTask(taskId, status, comment || undefined);
    setSelectedTask(null);
    setComment('');
  };

  const getAssignee = (assigneeId: string | null) => {
    return teamMembers.find(m => m.id === assigneeId);
  };

  // Se não for admin, mostra mensagem de acesso restrito
  if (!userIsAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-4">
            Apenas <strong>administradores</strong> podem validar tarefas concluídas.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">
                Entre em contato com um administrador para validar suas tarefas.
              </span>
            </div>
          </div>
          
          {/* Mostra tarefas pendentes do usuário */}
          {pendingTasks.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Tarefas aguardando validação:
              </h3>
              <div className="space-y-2">
                {pendingTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-500" />
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Validação de Tarefas</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        </div>
        <p className="text-gray-500 mt-1">Revise e aprove as tarefas concluídas pela equipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Validation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-yellow-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h2 className="font-semibold text-gray-800">Aguardando Validação</h2>
                <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {pendingTasks.length}
                </span>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Tudo em dia!</p>
                <p className="text-gray-400 text-sm mt-1">Não há tarefas pendentes de validação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingTasks.map(task => {
                  const assignee = getAssignee(task.assigneeId);
                  const completedChecklist = task.checklist.filter(i => i.completed).length;
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                        selectedTask?.id === task.id && "bg-blue-50"
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            {assignee && (
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 flex-shrink-0">
                                  {assignee.avatarUrl ? (
                                    <img src={assignee.avatarUrl} alt={assignee.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs">{assignee.avatar}</span>
                                  )}
                                </div>
                                <span>{assignee.name}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                            )}
                            {task.checklist.length > 0 && (
                              <div className="flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                <span>{completedChecklist}/{task.checklist.length}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidate(task.id, 'approved');
                            }}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Aprovar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                            title="Revisar"
                          >
                            <MessageSquare className="w-5 h-5" />
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

        {/* Validation Panel / Recent */}
        <div className="space-y-6">
          {/* Validation Form */}
          {selectedTask && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h2 className="font-semibold text-gray-800">Validar Tarefa</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedTask.description}</p>
                  )}
                </div>

                {/* Checklist Preview */}
                {selectedTask.checklist.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Checklist</p>
                    <div className="space-y-1">
                      {selectedTask.checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckSquare className={cn(
                            "w-4 h-4",
                            item.completed ? "text-green-500" : "text-gray-300"
                          )} />
                          <span className={item.completed ? "text-gray-600" : "text-gray-400"}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentário (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicione um comentário sobre a validação..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleValidate(selectedTask.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleValidate(selectedTask.id, 'needs_adjustment')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Ajustar
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setComment('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Recently Validated */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Validações Recentes</h2>
            </div>
            
            {recentlyValidated.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Nenhuma validação recente
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentlyValidated.map(task => (
                  <div key={task.id} className="p-3 flex items-center gap-3">
                    {task.validationStatus === 'approved' ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.validationStatus === 'approved' ? 'Aprovada' : 'Devolvida para ajustes'}
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
