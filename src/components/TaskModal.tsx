import { useState } from 'react';
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
  ShieldCheck
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

export function TaskModal({ task, columnId, onClose, mode: initialMode }: TaskModalProps) {
  const { teamMembers, addTask, updateTask, deleteTask, currentUser, columns, isAdmin, canEditTask } = useApp();
  const userIsAdmin = isAdmin();
  const taskIsEditable = task ? canEditTask(task) : false;

  const effectiveMode = (!userIsAdmin && initialMode === 'edit' && !taskIsEditable) ? 'view' : initialMode;
  const canCreate = initialMode === 'create' && !!currentUser;
  
  const [mode, setMode] = useState(effectiveMode);
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assigneeId || null);
  const [startDate, setStartDate] = useState(task?.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist || []);
  const [comments, setComments] = useState<Comment[]>(task?.comments || []);
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState(task?.columnId || columnId || 'backlog');

  const isViewMode = mode === 'view';
  const canEdit = task ? taskIsEditable : canCreate;
  const activeTeamMembers = teamMembers.filter(member => member.isActive !== false);

  const persistExistingTask = (updates: Partial<Task>) => {
    if (!task || !canEditTask(task)) return;
    updateTask(task.id, updates);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (!canEdit || !currentUser) return;

    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    if (parsedDueDate && parsedStartDate > parsedDueDate) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      startDate: parsedStartDate,
      dueDate: parsedDueDate,
      status: task?.status || 'planned' as const,
      checklist,
      comments,
      attachments,
      columnId: selectedColumnId,
      createdBy: task?.createdBy || currentUser.id,
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
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
    setChecklist([...checklist, { id: generateId(), text: newChecklistItem.trim(), completed: false }]);
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

    const updatedComments = [...comments, {
      id: generateId(),
      userId: currentUser.id,
      text: newComment.trim(),
      createdAt: new Date()
    }];

    setComments(updatedComments);
    persistExistingTask({ comments: updatedComments });
    setNewComment('');
  };

  const addAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    const sanitizedUrl = sanitizeExternalUrl(newAttachmentUrl);
    if (!sanitizedUrl) return;

    const updatedAttachments = [...attachments, {
      id: generateId(),
      name: newAttachmentName.trim(),
      url: sanitizedUrl,
      type: 'link' as const,
    }];

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {mode === 'create' ? 'Nova Tarefa' : isViewMode ? 'Detalhes da Tarefa' : 'Editar Tarefa'}
            </h2>
            {/* Admin Badge */}
            {userIsAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
            )}
            {/* Locked indicator for non-admins viewing existing tasks */}
            {!userIsAdmin && task && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                <Lock className="w-3 h-3" />
                Somente leitura
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task && isViewMode && userIsAdmin && (
              <button
                onClick={() => setMode('edit')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Editar tarefa"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission Warning for non-admins */}
        {!userIsAdmin && task && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-700">
              <strong>Apenas administradores</strong> podem editar tarefas existentes. Você pode apenas visualizar e adicionar comentários.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isViewMode || (!canEdit && !!task)}
              placeholder="Digite o título da tarefa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isViewMode || (!canEdit && !!task)}
              placeholder="Descreva a tarefa em detalhes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

          {/* Column & Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  Coluna
                </span>
              </label>
              <select
                value={selectedColumnId}
                onChange={e => setSelectedColumnId(e.target.value)}
                disabled={isViewMode || (!canEdit && !!task)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" /> Responsável
                </span>
              </label>
              <select
                value={assigneeId || ''}
                onChange={e => setAssigneeId(e.target.value || null)}
                disabled={isViewMode || (!canEdit && !!task)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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

          {/* Datas: Criação, Início e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data de Criação (somente leitura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Data de Criação
                </span>
              </label>
              <input
                type="date"
                value={task?.createdAt ? format(new Date(task.createdAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Gerada automaticamente</p>
            </div>

            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-green-600" /> Data de Início
                </span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={isViewMode || (!canEdit && !!task)}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Quando a tarefa começa</p>
            </div>

            {/* Data de Prazo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-red-600" /> Data de Prazo
                </span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={isViewMode || (!canEdit && !!task)}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Prazo final para conclusão</p>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4" /> Checklist
              </span>
            </label>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id)}
                    disabled={isViewMode && !userIsAdmin}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={cn(
                    "flex-1 text-sm",
                    item.completed && "line-through text-gray-400"
                  )}>
                    {item.text}
                  </span>
                  {canEdit && !isViewMode && (
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && !isViewMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Adicionar item"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> Anexos e Links
              </span>
            </label>
            <div className="space-y-2">
              {attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {attachment.name}
                  </a>
                  {canEdit && !isViewMode && (
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && !isViewMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={e => setNewAttachmentName(e.target.value)}
                    placeholder="Nome"
                    className="w-1/3 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="url"
                    value={newAttachmentUrl}
                    onChange={e => setNewAttachmentUrl(e.target.value)}
                    placeholder="URL"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addAttachment}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments - Everyone can add comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> Comentários
              </span>
            </label>
            <div className="space-y-3">
              {comments.map(comment => {
                const author = teamMembers.find(m => m.id === comment.userId);
                return (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 flex-shrink-0">
                        {author?.avatarUrl ? (
                          <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{author?.avatar}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{author?.name}</span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(comment.createdAt), 'dd/MM HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.text}</p>
                  </div>
                );
              })}
              {/* Everyone can add comments */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Adicionar comentário"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addComment}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {task && userIsAdmin && !isViewMode && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isViewMode ? 'Fechar' : 'Cancelar'}
            </button>
            {canEdit && !isViewMode && (
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
