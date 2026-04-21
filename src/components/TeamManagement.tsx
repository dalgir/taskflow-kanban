import { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { TeamMember } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  User,
  Mail,
  Briefcase,
  Shield,
  ShieldCheck,
  Lock,
  Camera,
  ImagePlus
} from 'lucide-react';
import { cn } from '../utils/cn';

const avatarOptions = [
  '👨‍💼',
  '👩‍💼',
  '👨‍💻',
  '👩‍💻',
  '👨‍🎨',
  '👩‍🎨',
  '👨‍🔬',
  '👩‍🔬',
  '👨‍🏫',
  '👩‍🏫',
  '🧑‍💼',
  '🧑‍💻'
];

export function TeamManagement() {
  const {
    teamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    tasks,
    isAdmin
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    avatar: '👨‍💼',
    avatarUrl: '' as string | undefined,
    isAdmin: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIsAdmin = isAdmin();

  const openModal = (member?: TeamMember) => {
    if (!userIsAdmin) return;

    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        avatarUrl: member.avatarUrl,
        isAdmin: member.isAdmin
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        role: '',
        avatar: '👨‍💼',
        avatarUrl: undefined,
        isAdmin: false
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      role: '',
      avatar: '👨‍💼',
      avatarUrl: undefined,
      isAdmin: false
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, avatarUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData({ ...formData, avatarUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    if (editingMember) {
      updateTeamMember(editingMember.id, formData);
    } else {
      addTeamMember(formData);
    }

    closeModal();
  };

  const handleDelete = (memberId: string) => {
    if (!userIsAdmin) return;

    if (
      window.confirm(
        'Tem certeza que deseja remover este membro? As tarefas atribuídas serão movidas para o backlog.'
      )
    ) {
      deleteTeamMember(memberId);
    }
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assigneeId === memberId);
    const completed = memberTasks.filter(
      t => t.status === 'completed' || t.status === 'approved'
    ).length;
    const inProgress = memberTasks.filter(
      t => t.status === 'in_progress'
    ).length;
    const total = memberTasks.length;

    return { total, completed, inProgress };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Equipe</h1>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Gerencie os membros da equipe e atribuições.
          </p>
        </div>

        {userIsAdmin ? (
          <button
            onClick={() => openModal()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Novo membro</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-gray-500">
            <Lock className="h-5 w-5" />
            <span className="text-sm">Apenas administradores podem editar</span>
          </div>
        )}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {teamMembers.map(member => {
          const stats = getMemberStats(member.id);

          return (
            <div
              key={member.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className={cn(
                  'h-1.5',
                  member.isAdmin
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                )}
              />

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-3xl shadow-sm',
                      !member.avatarUrl &&
                        (member.isAdmin
                          ? 'bg-gradient-to-br from-amber-100 to-amber-200'
                          : 'bg-gradient-to-br from-blue-100 to-blue-200')
                    )}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      member.avatar
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-gray-800">
                            {member.name}
                          </h3>

                          {member.isAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex items-center gap-1 text-sm text-blue-600">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{member.role}</span>
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-400">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      {userIsAdmin && (
                        <div className="flex items-center gap-1 self-start">
                          <button
                            onClick={() => openModal(member)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Editar membro"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(member.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remover membro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                    <p className="mt-1 text-xs text-gray-500">Total</p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {stats.inProgress}
                    </p>
                    <p className="mt-1 text-xs text-blue-600">Em andamento</p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-3 text-center">
                    <p className="text-xl font-bold text-green-600">
                      {stats.completed}
                    </p>
                    <p className="mt-1 text-xs text-green-600">Concluídas</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Member Card */}
        {userIsAdmin && (
          <button
            onClick={() => openModal()}
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
              <Plus className="h-6 w-6 text-gray-500" />
            </div>
            <span className="font-medium text-gray-500">Adicionar membro</span>
          </button>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && userIsAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-dvh w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-3xl">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
                      {editingMember ? 'Editar membro' : 'Novo membro'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Cadastre informações, imagem e permissões do usuário.
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100"
                    aria-label="Fechar modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Foto */}
                  <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Foto do membro
                      </span>
                    </label>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative">
                        <div
                          className={cn(
                            'flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-4xl',
                            formData.avatarUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 bg-gray-50'
                          )}
                        >
                          {formData.avatarUrl ? (
                            <img
                              src={formData.avatarUrl}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{formData.avatar}</span>
                          )}
                        </div>

                        {formData.avatarUrl && (
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          <ImagePlus className="h-4 w-4" />
                          {formData.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <p className="text-xs text-gray-500">
                          JPG, PNG ou GIF com até 2MB.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Avatar padrão */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                      Avatar padrão{' '}
                      {formData.avatarUrl && (
                        <span className="font-normal text-gray-400">
                          (usado se remover a foto)
                        </span>
                      )}
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {avatarOptions.map(avatar => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar })}
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl transition',
                            formData.avatar === avatar
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Dados principais */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                      Informações principais
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Nome
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Nome completo"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            E-mail
                          </span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="email@empresa.com"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            Função
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.role}
                          onChange={e =>
                            setFormData({ ...formData, role: e.target.value })
                          }
                          placeholder="Ex: Desenvolvedor, Designer..."
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* Permissões */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                      Permissões
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={formData.isAdmin}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              isAdmin: e.target.checked
                            })
                          }
                          className="sr-only"
                        />

                        <div
                          className={cn(
                            'h-6 w-10 rounded-full transition-colors',
                            formData.isAdmin ? 'bg-amber-500' : 'bg-gray-300'
                          )}
                        >
                          <div
                            className={cn(
                              'mt-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                              formData.isAdmin ? 'translate-x-5' : 'translate-x-1'
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </span>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Administradores podem editar tarefas, gerenciar equipe e
                          validar conclusões.
                        </p>
                      </div>
                    </label>
                  </section>
                </form>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* clique fora */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 -z-10 cursor-default"
            aria-label="Fechar modal"
          />
        </div>
      )}
    </div>
  );
}