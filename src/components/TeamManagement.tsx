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

const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬', '👨‍🏫', '👩‍🏫', '🧑‍💼', '🧑‍💻'];

export function TeamManagement() {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, tasks, isAdmin } = useApp();
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
      setFormData({ name: '', email: '', role: '', avatar: '👨‍💼', avatarUrl: undefined, isAdmin: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: '', email: '', role: '', avatar: '👨‍💼', avatarUrl: undefined, isAdmin: false });
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
    if (window.confirm('Tem certeza que deseja remover este membro? As tarefas atribuídas serão movidas para o backlog.')) {
      deleteTeamMember(memberId);
    }
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assigneeId === memberId);
    const completed = memberTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
    const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
    const total = memberTasks.length;
    return { total, completed, inProgress };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Equipe</h1>
          <p className="text-gray-500 mt-1">Gerencie os membros da equipe e atribuições</p>
        </div>
        {userIsAdmin ? (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Membro</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
            <Lock className="w-5 h-5" />
            <span className="text-sm">Apenas administradores podem editar</span>
          </div>
        )}
      </div>

      {/* Team Grid - Layout igual às tarefas (2 por linha) */}
      <div className="grid grid-cols-2 gap-4">
        {teamMembers.map(member => {
          const stats = getMemberStats(member.id);
          return (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Barra de status colorida no topo */}
              <div className={cn(
                "h-1.5",
                member.isAdmin 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600" 
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              )}></div>
              
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0 overflow-hidden",
                    !member.avatarUrl && (member.isAdmin 
                      ? "bg-gradient-to-br from-amber-100 to-amber-200" 
                      : "bg-gradient-to-br from-blue-100 to-blue-200")
                  )}>
                    {member.avatarUrl ? (
                      <img 
                        src={member.avatarUrl} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.avatar
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 text-lg">{member.name}</h3>
                          {member.isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-600 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {member.role}
                        </p>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          {member.email}
                        </p>
                      </div>
                      
                      {/* Actions - Only for Admin */}
                      {userIsAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal(member)}
                            className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
                    <p className="text-xs text-blue-600">Em Andamento</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-green-600">Concluídas</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Member Card - Only for Admin */}
        {userIsAdmin && (
          <button
            onClick={() => openModal()}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[180px]"
          >
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-gray-500 font-medium">Adicionar Membro</span>
          </button>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && userIsAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Foto do Membro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" /> Foto do Membro
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview da foto */}
                  <div className="relative">
                    <div className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center text-3xl border-2 border-dashed",
                      formData.avatarUrl ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
                    )}>
                      {formData.avatarUrl ? (
                        <img 
                          src={formData.avatarUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{formData.avatar}</span>
                      )}
                    </div>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Botões de upload */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {formData.avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">JPG, PNG ou GIF (max 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Avatar Padrão (caso não tenha foto) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar Padrão {formData.avatarUrl && <span className="text-gray-400">(usado se remover a foto)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions.map(avatar => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar })}
                      className={cn(
                        "w-10 h-10 text-xl rounded-lg flex items-center justify-center border-2 transition-colors",
                        formData.avatar === avatar
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> Nome
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> E-mail
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" /> Função
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Desenvolvedor, Designer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Admin Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={e => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors",
                      formData.isAdmin ? "bg-amber-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1",
                        formData.isAdmin ? "translate-x-5" : "translate-x-1"
                      )}></div>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4" />
                    Administrador
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-13">
                  Administradores podem editar tarefas e validar conclusões
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
