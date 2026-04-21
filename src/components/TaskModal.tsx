import { useMemo, useState } from 'react';
import { Task, ChecklistItem, Comment, Attachment } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  X,
  Calendar,
  User,
  CheckSquare,
  Plus,
  Trash2,
  MessageSquare,
  Paperclip,
  Link as LinkIcon,
  Send,
  Edit2,
  Save,
  Lock,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface TaskModalProps {
  task?: Task;
  columnId?: string;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const sanitizeExternalUrl = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

const resolveColumnIdForAssignee = (assigneeId: string | null) => {
  return assigneeId ? `member-${assigneeId}` : 'backlog';
};

const parseLocalDate = (value: string): Date | null => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export function TaskModal({ task, columnId, onClose, mode: initialMode }: TaskModalProps) {
  const {
    teamMembers,
    addTask,
    addTaskCopies,
    duplicateTask,
    updateTask,
    deleteTask,
    currentUser,
    columns,
    isAdmin,
    canEditTask
  } = useApp();

  const userIsAdmin = isAdmin();
  const taskIsEditable = task ? canEditTask(task) : false;

  const effectiveMode =
    !userIsAdmin && initialMode === 'edit' && !taskIsEditable
      ? 'view'
      : initialMode;

  const canCreate = initialMode === 'create' && !!currentUser;

  const [mode, setMode] = useState(effectiveMode);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assigneeId || null);
  const [additionalAssigneeIds, setAdditionalAssigneeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(
    task?.startDate
      ? format(new Date(task.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist || []);
  const [comments, setComments] = useState<Comment[]>(task?.comments || []);
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState(
    task?.columnId || columnId || 'backlog'
  );

  const isViewMode = mode === 'view';
  const canEdit = task ? taskIsEditable : canCreate;
  const activeTeamMembers = teamMembers.filter(member => member.isActive !== false);

  const secondaryAssigneeOptions = useMemo(() => {
    return activeTeamMembers.filter(member => member.id !== assigneeId);
  }, [activeTeamMembers, assigneeId]);

  const persistExistingTask = (updates: Partial<Task>) => {
    if (!task || !canEditTask(task)) return;
    updateTask(task.id, updates);
  };

  const toggleAdditionalAssignee = (memberId: string) => {
    setAdditionalAssigneeIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleDuplicateTask = () => {
    if (!task) return;
    duplicateTask(task.id);
    onClose();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (!canEdit || !currentUser) return;

    const parsedStartDate = parseLocalDate(startDate) || new Date();
    const parsedDueDate = parseLocalDate(dueDate);

    if (parsedDueDate && parsedStartDate > parsedDueDate) return;

    const primaryColumnId =
      selectedColumnId === 'backlog' || !assigneeId
        ? 'backlog'
        : resolveColumnIdForAssignee(assigneeId);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      startDate: parsedStartDate,
      dueDate: parsedDueDate,
      status: task?.status || ('planned' as const),
      checklist,
      comments,
      attachments,
      columnId: primaryColumnId,
      createdBy: task?.createdBy || currentUser.id,
    };

    if (task) {
      updateTask(task.id, taskData);

      if (additionalAssigneeIds.length > 0) {
        addTaskCopies(
          {
            ...taskData,
            assigneeId: null,
            columnId: 'backlog',
            comments: [],
          },
          additionalAssigneeIds
        );
      }
    } else {
      addTask(taskData);

      if (additionalAssigneeIds.length > 0) {
        addTaskCopies(
          {
            ...taskData,
            assigneeId: null,
            columnId: 'backlog',
            comments: [],
          },
          additionalAssigneeIds
        );
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!userIsAdmin) return;
    if (task && window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: generateId(),
        text: newChecklistItem.trim(),
        completed: false
      }
    ]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    persistExistingTask({ checklist: updatedChecklist });
  };

  const removeChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    setChecklist(updatedChecklist);
    persistExistingTask({ checklist: updatedChecklist });
  };

  const addComment = () => {
    if (!newComment.trim() || !currentUser) return;
    if (task && !canEditTask(task)) return;

    const updatedComments = [
      ...comments,
      {
        id: generateId(),
        userId: currentUser.id,
        text: newComment.trim(),
        createdAt: new Date()
      }
    ];

    setComments(updatedComments);
    persistExistingTask({ comments: updatedComments });
    setNewComment('');
  };

  const addAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;

    const sanitizedUrl = sanitizeExternalUrl(newAttachmentUrl);
    if (!sanitizedUrl) return;

    const updatedAttachments = [
      ...attachments,
      {
        id: generateId(),
        name: newAttachmentName.trim(),
        url: sanitizedUrl,
        type: 'link' as const,
      }
    ];

    setAttachments(updatedAttachments);
    persistExistingTask({ attachments: updatedAttachments });
    setNewAttachmentName('');
    setNewAttachmentUrl('');
  };

  const removeAttachment = (attachmentId: string) => {
    const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
    setAttachments(updatedAttachments);
    persistExistingTask({ attachments: updatedAttachments });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex w-full flex-col bg-white shadow-2xl',
            'h-dvh rounded-none',
            'sm:h-auto sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-2xl'
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-800 sm:text-xl">
                    {mode === 'create'
                      ? 'Nova Tarefa'
                      : isViewMode
                      ? 'Detalhes da Tarefa'
                      : 'Editar Tarefa'}
                  </h2>

                  {userIsAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}

                  {!userIsAdmin && task && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      <Lock className="h-3 w-3" />
                      Somente leitura
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  {mode === 'create'
                    ? 'Preencha os dados para criar uma nova tarefa.'
                    : isViewMode
                    ? 'Visualize as informações, checklist, anexos e comentários.'
                    : 'Atualize os dados da tarefa.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {task && isViewMode && userIsAdmin && (
                  <button
                    onClick={() => setMode('edit')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100"
                    title="Editar tarefa"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {!userIsAdmin && task && (
            <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:mx-6">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-700">
                  <strong>Apenas administradores</strong> podem editar tarefas existentes.
                  Você pode visualizar as informações e adicionar comentários.
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                  Informações principais
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Título
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={isViewMode || (!canEdit && !!task)}
                      placeholder="Digite o título da tarefa"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      disabled={isViewMode || (!canEdit && !!task)}
                      placeholder="Descreva a tarefa em detalhes"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Coluna
                      </label>
                      <select
                        value={selectedColumnId}
                        onChange={e => setSelectedColumnId(e.target.value)}
                        disabled={isViewMode || (!canEdit && !!task)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {columns.map(col => (
                          <option key={col.id} value={col.id}>
                            {col.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Responsável principal
                        </span>
                      </label>
                      <select
                        value={assigneeId || ''}
                        onChange={e => {
                          const nextAssignee = e.target.value || null;
                          setAssigneeId(nextAssignee);
                          setAdditionalAssigneeIds(prev =>
                            prev.filter(id => id !== nextAssignee)
                          );
                        }}
                        disabled={isViewMode || (!canEdit && !!task)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Não atribuído</option>
                        {activeTeamMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.avatar} {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {canEdit && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Duplicar para outros responsáveis
                      </label>

                      <div className="rounded-2xl border border-gray-200 bg-white p-3">
                        {secondaryAssigneeOptions.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Selecione um responsável principal para liberar outras cópias.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {secondaryAssigneeOptions.map(member => {
                              const checked = additionalAssigneeIds.includes(member.id);

                              return (
                                <label
                                  key={member.id}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                                    checked
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:bg-gray-50'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleAdditionalAssignee(member.id)}
                                    disabled={isViewMode || (!canEdit && !!task)}
                                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {member.avatar} {member.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          {task
                            ? 'Ao salvar, a tarefa atual será atualizada e cópias novas serão criadas para os responsáveis marcados.'
                            : 'O sistema criará uma cópia da mesma tarefa para cada responsável marcado.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Data de Criação
                        </span>
                      </label>
                      <input
                        type="date"
                        value={
                          task?.createdAt
                            ? format(new Date(task.createdAt), 'yyyy-MM-dd')
                            : format(new Date(), 'yyyy-MM-dd')
                        }
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Gerada automaticamente
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-green-600" />
                          Data de Início
                        </span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        disabled={isViewMode || (!canEdit && !!task)}
                        className="w-full rounded-xl border border-green-300 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Quando a tarefa começa
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-red-600" />
                          Data de Prazo
                        </span>
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        disabled={isViewMode || (!canEdit && !!task)}
                        className="w-full rounded-xl border border-red-300 px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Prazo final para conclusão
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Checklist
                  </span>
                </label>

                <div className="space-y-2.5">
                  {checklist.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        disabled={isViewMode && !userIsAdmin}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          item.completed && 'text-gray-400 line-through'
                        )}
                      >
                        {item.text}
                      </span>

                      {canEdit && !isViewMode && (
                        <button
                          onClick={() => removeChecklistItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {canEdit && !isViewMode && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={e => setNewChecklistItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                        placeholder="Adicionar item"
                        className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addChecklistItem}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos e Links
                  </span>
                </label>

                <div className="space-y-2.5">
                  {attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <LinkIcon className="h-4 w-4 shrink-0 text-gray-500" />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-sm text-blue-600 hover:underline"
                      >
                        {attachment.name}
                      </a>

                      {canEdit && !isViewMode && (
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {canEdit && !isViewMode && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                      <input
                        type="text"
                        value={newAttachmentName}
                        onChange={e => setNewAttachmentName(e.target.value)}
                        placeholder="Nome do link"
                        className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={e => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addAttachment}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários
                  </span>
                </label>

                <div className="space-y-3">
                  {comments.map(comment => {
                    const author = teamMembers.find(m => m.id === comment.userId);

                    return (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                            {author?.avatarUrl ? (
                              <img
                                src={author.avatarUrl}
                                alt={author.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">{author?.avatar}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-700">
                              {author?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(comment.createdAt), 'dd/MM HH:mm')}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm leading-5 text-gray-600">
                          {comment.text}
                        </p>
                      </div>
                    );
                  })}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      placeholder="Adicionar comentário"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addComment}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                {task && userIsAdmin && (
                  <button
                    onClick={handleDuplicateTask}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </button>
                )}

                {task && userIsAdmin && !isViewMode && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  onClick={onClose}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  {isViewMode ? 'Fechar' : 'Cancelar'}
                </button>

                {canEdit && !isViewMode && (
                  <button
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {additionalAssigneeIds.length > 0
                      ? `Salvar + ${additionalAssigneeIds.length} cópia(s)`
                      : 'Salvar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="Fechar modal"
      />
    </div>
  );
}