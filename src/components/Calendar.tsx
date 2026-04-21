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
import { cn } from '../utils/cn';

const absenceTypeConfig: Record<
  AbsenceType,
  { label: string; color: string; bgColor: string; icon: typeof Stethoscope }
> = {
  medical: {
    label: 'Consulta Médica',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-300',
    icon: Stethoscope
  },
  sick: {
    label: 'Doença',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
    icon: ThermometerSun
  },
  meeting: {
    label: 'Reunião Externa',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-300',
    icon: Users
  },
  vacation: {
    label: 'Férias',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
    icon: Palmtree
  },
  personal: {
    label: 'Assunto Pessoal',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-300',
    icon: User
  },
  other: {
    label: 'Outros',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: HelpCircle
  }
};

export default function Calendar() {
  const {
    teamMembers,
    absenceEvents,
    addAbsenceEvent,
    deleteAbsenceEvent,
    getAbsencesByDate
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent] = useState<AbsenceEvent | null>(null);

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
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

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

    setShowModal(true);
  };

  const closeModal = () => {
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

    closeModal();
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

  const upcomingEvents = absenceEvents
    .filter(e => new Date(e.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <CalendarIcon className="h-7 w-7 text-indigo-600" />
            Calendário de Ausências
          </h1>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Visualize e gerencie as ausências da equipe.
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-white shadow-md transition hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Nova ausência
        </button>
      </div>

      {/* Legenda */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-600">Legenda</h3>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(absenceTypeConfig).map(([type, config]) => {
            const Icon = config.icon;

            return (
              <div
                key={type}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                  config.bgColor,
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Calendário */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm xl:col-span-2 sm:p-6">
          {/* Navegação */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={handlePrevMonth}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <h2 className="text-center text-lg font-semibold capitalize text-gray-800 sm:text-xl">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <button
              onClick={handleNextMonth}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div
                key={day}
                className="py-2 text-center text-[11px] font-semibold text-gray-500 sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(day => {
              const dayEvents = getEventsForDate(day);
              const currentMonthDay = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayIsToday = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'min-h-[92px] rounded-xl border p-2 text-left transition sm:min-h-[112px]',
                    currentMonthDay ? 'bg-white' : 'bg-gray-50',
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-indigo-300',
                    dayIsToday && 'bg-indigo-50'
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 text-sm font-medium',
                      !currentMonthDay && 'text-gray-400',
                      dayIsToday ? 'font-bold text-indigo-600' : 'text-gray-700'
                    )}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => {
                      const member = getMemberById(event.memberId);
                      const config = absenceTypeConfig[event.type];

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'flex items-center gap-1 rounded-md border p-1 text-[10px] sm:text-xs',
                            config.bgColor,
                            config.color
                          )}
                          title={`${member?.name} - ${event.title}`}
                        >
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/50">
                            {member?.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[9px]">{member?.avatar}</span>
                            )}
                          </div>

                          <span className="truncate font-medium">
                            {member?.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-medium text-gray-500 sm:text-xs">
                        +{dayEvents.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Detalhes do dia */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                  : 'Selecione um dia'}
              </h3>

              {selectedDate && (
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition hover:bg-indigo-200"
                  title="Adicionar ausência neste dia"
                >
                  <Plus className="h-4 w-4" />
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
                        className={cn(
                          'rounded-2xl border-2 p-4',
                          config.bgColor
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/50 text-2xl">
                              {member?.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member?.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                member?.avatar
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-semibold text-gray-800">
                                {member?.name}
                              </div>
                              <div className="truncate text-sm text-gray-500">
                                {member?.role}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(event.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className={cn('mb-2 flex items-center gap-2', config.color)}>
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>

                        <div className="mb-1 font-medium text-gray-800">
                          {event.title}
                        </div>

                        {event.description && (
                          <p className="mb-2 text-sm text-gray-600">
                            {event.description}
                          </p>
                        )}

                        <div className="text-xs text-gray-500">
                          {format(new Date(event.startDate), 'dd/MM/yyyy')}
                          {event.endDate &&
                            !isSameDay(
                              new Date(event.startDate),
                              new Date(event.endDate)
                            ) && (
                              <> até {format(new Date(event.endDate), 'dd/MM/yyyy')}</>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Nenhuma ausência registrada</p>
                  <button
                    onClick={() => openAddModal(selectedDate)}
                    className="mt-3 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    + Adicionar ausência
                  </button>
                </div>
              )
            ) : (
              <div className="py-8 text-center">
                <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">
                  Clique em um dia para ver os detalhes
                </p>
              </div>
            )}
          </div>

          {/* Próximas ausências */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <h4 className="mb-4 font-semibold text-gray-700">
              Próximas ausências
            </h4>

            <div className="space-y-2">
              {upcomingEvents.map(event => {
                const member = getMemberById(event.memberId);
                const config = absenceTypeConfig[event.type];

                return (
                  <button
                    key={event.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50"
                    onClick={() => {
                      setSelectedDate(new Date(event.startDate));
                      setCurrentMonth(new Date(event.startDate));
                    }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl">
                      {member?.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member?.avatar
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {member?.name}
                      </div>
                      <div className={cn('text-xs', config.color)}>
                        {config.label}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {format(new Date(event.startDate), 'dd/MM')}
                    </div>
                  </button>
                );
              })}

              {upcomingEvents.length === 0 && (
                <p className="py-2 text-center text-sm text-gray-400">
                  Nenhuma ausência programada
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-dvh w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-3xl">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
                      {editingEvent ? 'Editar ausência' : 'Nova ausência'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Cadastre um afastamento, consulta, férias ou outro evento.
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
                  {/* Membro */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Membro da equipe
                    </label>
                    <select
                      value={formData.memberId}
                      onChange={e =>
                        setFormData({ ...formData, memberId: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Selecione...</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.avatar} {member.name} - {member.role}
                        </option>
                      ))}
                    </select>
                  </section>

                  {/* Tipo */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Tipo de ausência
                    </label>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(absenceTypeConfig).map(([type, config]) => {
                        const Icon = config.icon;
                        const isSelected = formData.type === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                type: type as AbsenceType
                              })
                            }
                            className={cn(
                              'flex min-h-[48px] items-center gap-2 rounded-xl border-2 p-3 text-left transition',
                              isSelected
                                ? `${config.bgColor} ${config.color} border-current`
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">
                              {config.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Dados */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                      Informações do evento
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Título / motivo
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={e =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Ex: Consulta médica, atestado, reunião..."
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              description: e.target.value
                            })
                          }
                          placeholder="Detalhes adicionais..."
                          rows={3}
                          className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Data início
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value
                              })
                            }
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Data fim
                          </label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value
                              })
                            }
                            min={formData.startDate}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
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
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    {editingEvent ? 'Salvar' : 'Adicionar'}
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