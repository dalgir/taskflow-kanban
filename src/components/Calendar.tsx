import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  Stethoscope,
  ThermometerSun,
  Users,
  Palmtree,
  User,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AbsenceEvent, AbsenceType } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const absenceTypeConfig: Record<AbsenceType, { label: string; color: string; bgColor: string; icon: typeof Stethoscope }> = {
  medical: { label: 'Consulta Médica', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300', icon: Stethoscope },
  sick: { label: 'Doença', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300', icon: ThermometerSun },
  meeting: { label: 'Reunião Externa', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300', icon: Users },
  vacation: { label: 'Férias', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300', icon: Palmtree },
  personal: { label: 'Assunto Pessoal', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300', icon: User },
  other: { label: 'Outros', color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-300', icon: HelpCircle },
};

export default function Calendar() {
  const { teamMembers, absenceEvents, addAbsenceEvent, deleteAbsenceEvent, getAbsencesByDate } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AbsenceEvent | null>(null);
  
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'medical' as AbsenceType,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: true,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const openAddModal = (date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    setFormData({
      memberId: teamMembers[0]?.id || '',
      type: 'medical',
      title: '',
      description: '',
      startDate: format(targetDate, 'yyyy-MM-dd'),
      endDate: format(targetDate, 'yyyy-MM-dd'),
      allDay: true,
    });
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.memberId || !formData.title || !formData.startDate) return;

    addAbsenceEvent({
      memberId: formData.memberId,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      startDate: new Date(formData.startDate + 'T00:00:00'),
      endDate: new Date((formData.endDate || formData.startDate) + 'T23:59:59'),
      allDay: formData.allDay,
    });

    setShowModal(false);
    setFormData({
      memberId: '',
      type: 'medical',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      allDay: true,
    });
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir esta ausência?')) {
      deleteAbsenceEvent(eventId);
    }
  };

  const getMemberById = (memberId: string) => {
    return teamMembers.find(m => m.id === memberId);
  };

  const getEventsForDate = (date: Date) => {
    return getAbsencesByDate(date);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-indigo-600" />
              Calendário de Ausências
            </h1>
            <p className="text-gray-500 mt-1">
              Visualize e gerencie as ausências da equipe
            </p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nova Ausência
          </button>
        </div>
      </div>

      {/* Legenda de Tipos */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Legenda:</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(absenceTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div 
                key={type} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.color}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Navegação do Mês */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}
                    ${dayIsToday ? 'bg-indigo-50' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                    ${dayIsToday ? 'text-indigo-600 font-bold' : 'text-gray-700'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const member = getMemberById(event.memberId);
                      const config = absenceTypeConfig[event.type];
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border truncate ${config.bgColor} ${config.color} flex items-center gap-1`}
                          title={`${member?.name} - ${event.title}`}
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/50">
                            {member?.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px]">{member?.avatar}</span>
                            )}
                          </div>
                          <span className="font-medium truncate">{member?.name.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Lateral - Detalhes do Dia */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDate 
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'
              }
            </h3>
            {selectedDate && (
              <button
                onClick={() => openAddModal(selectedDate)}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                title="Adicionar ausência neste dia"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedDate ? (
            selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map(event => {
                  const member = getMemberById(event.memberId);
                  const config = absenceTypeConfig[event.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-2 ${config.bgColor}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white/50 text-2xl flex-shrink-0">
                            {member?.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member?.name} className="w-full h-full object-cover" />
                            ) : (
                              member?.avatar
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{member?.name}</div>
                            <div className="text-sm text-gray-500">{member?.role}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className={`flex items-center gap-2 mb-2 ${config.color}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      
                      <div className="font-medium text-gray-800 mb-1">{event.title}</div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {format(new Date(event.startDate), 'dd/MM/yyyy')}
                        {event.endDate && !isSameDay(new Date(event.startDate), new Date(event.endDate)) && (
                          <> até {format(new Date(event.endDate), 'dd/MM/yyyy')}</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma ausência registrada</p>
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Adicionar ausência
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Clique em um dia para ver os detalhes</p>
            </div>
          )}

          {/* Próximas Ausências */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">Próximas Ausências</h4>
            <div className="space-y-2">
              {absenceEvents
                .filter(e => new Date(e.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map(event => {
                  const member = getMemberById(event.memberId);
                  const config = absenceTypeConfig[event.type];
                  return (
                    <div 
                      key={event.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedDate(new Date(event.startDate));
                        setCurrentMonth(new Date(event.startDate));
                      }}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-xl flex-shrink-0">
                        {member?.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member?.name} className="w-full h-full object-cover" />
                        ) : (
                          member?.avatar
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {member?.name}
                        </div>
                        <div className={`text-xs ${config.color}`}>
                          {config.label}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(event.startDate), 'dd/MM')}
                      </div>
                    </div>
                  );
                })
              }
              {absenceEvents.filter(e => new Date(e.startDate) >= new Date()).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  Nenhuma ausência programada
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Ausência */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingEvent ? 'Editar Ausência' : 'Nova Ausência'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Membro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membro da Equipe
                </label>
                <select
                  value={formData.memberId}
                  onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.avatar} {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Ausência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ausência
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(absenceTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type as AbsenceType })}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left
                          ${isSelected 
                            ? `${config.bgColor} ${config.color} border-current` 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título / Motivo
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Consulta médica, Atestado, Reunião no cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingEvent ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
