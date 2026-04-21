import { useApp } from '../contexts/AppContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Award
} from 'lucide-react';
import { isPast } from 'date-fns';
import { cn } from '../utils/cn';

export function Reports() {
  const { tasks, teamMembers } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    t => t.status === 'completed' || t.status === 'approved'
  ).length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const plannedTasks = tasks.filter(t => t.status === 'planned').length;
  const awaitingValidation = tasks.filter(
    t => t.status === 'awaiting_validation'
  ).length;

  const overdueTasks = tasks.filter(
    t =>
      t.dueDate &&
      isPast(new Date(t.dueDate)) &&
      t.status !== 'completed' &&
      t.status !== 'approved'
  ).length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const memberStats = teamMembers
    .map(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const completed = memberTasks.filter(
        t => t.status === 'completed' || t.status === 'approved'
      ).length;
      const total = memberTasks.length;
      const overdue = memberTasks.filter(
        t =>
          t.dueDate &&
          isPast(new Date(t.dueDate)) &&
          t.status !== 'completed' &&
          t.status !== 'approved'
      ).length;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...member,
        total,
        completed,
        overdue,
        productivity
      };
    })
    .sort((a, b) => b.productivity - a.productivity);

  const topPerformer = memberStats.find(m => m.total > 0);

  const getRateColor = (value: number) => {
    if (value >= 70) return 'text-green-700 bg-green-100';
    if (value >= 40) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getBarColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Acompanhe o desempenho da equipe nesta semana.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalTasks}</p>
          <p className="mt-1 text-sm text-gray-500">Tarefas criadas</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                getRateColor(completionRate)
              )}
            >
              {completionRate}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{completedTasks}</p>
          <p className="mt-1 text-sm text-gray-500">Concluídas</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-gray-400">
              Em andamento
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{inProgressTasks}</p>
          <p className="mt-1 text-sm text-gray-500">Em progresso</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                overdueTasks === 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {overdueTasks === 0 ? 'OK' : 'Atenção'}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{overdueTasks}</p>
          <p className="mt-1 text-sm text-gray-500">Atrasadas</p>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Task Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-800">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Distribuição de tarefas
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-gray-600">Planejadas</span>
                <span className="text-sm font-medium text-gray-800">
                  {plannedTasks}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-400 transition-all duration-500"
                  style={{
                    width: `${totalTasks > 0 ? (plannedTasks / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-gray-600">Em andamento</span>
                <span className="text-sm font-medium text-gray-800">
                  {inProgressTasks}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-gray-600">Aguardando validação</span>
                <span className="text-sm font-medium text-gray-800">
                  {awaitingValidation}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${totalTasks > 0 ? (awaitingValidation / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-gray-600">Concluídas</span>
                <span className="text-sm font-medium text-gray-800">
                  {completedTasks}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-800">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Taxa de conclusão
          </h2>

          <div className="flex items-center justify-center py-4 sm:py-6">
            <div className="relative h-36 w-36 sm:h-40 sm:w-40">
              <svg
                className="h-full w-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${completionRate * 2.51} 251`}
                  className={cn(
                    'transition-all duration-1000',
                    completionRate >= 70
                      ? 'text-green-500'
                      : completionRate >= 40
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  )}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">
                  {completionRate}%
                </span>
                <span className="text-xs text-gray-500">Concluído</span>
              </div>
            </div>
          </div>

          {topPerformer && topPerformer.productivity > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-100">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Destaque da semana
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {topPerformer.avatar} {topPerformer.name} —{' '}
                  {topPerformer.productivity}% de conclusão
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Productivity */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Users className="h-5 w-5 text-blue-500" />
            Produtividade por membro
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Membro
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Concluídas
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Atrasadas
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  Produtividade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {memberStats.map((member, index) => (
                <tr key={member.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg">
                        {member.avatar}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {member.role}
                        </p>
                      </div>

                      {index === 0 && member.productivity > 0 && (
                        <Award className="h-5 w-5 shrink-0 text-yellow-500" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center text-gray-600">
                    {member.total}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className="font-medium text-green-600">
                      {member.completed}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={cn(
                        'font-medium',
                        member.overdue > 0 ? 'text-red-600' : 'text-gray-400'
                      )}
                    >
                      {member.overdue}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            getBarColor(member.productivity)
                          )}
                          style={{ width: `${member.productivity}%` }}
                        />
                      </div>

                      <span className="w-11 text-right text-sm font-medium text-gray-600">
                        {member.productivity}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {memberStats.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Nenhum membro encontrado para exibir produtividade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}