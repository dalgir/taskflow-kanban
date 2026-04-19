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

  // Calculate overall stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const plannedTasks = tasks.filter(t => t.status === 'planned').length;
  const awaitingValidation = tasks.filter(t => t.status === 'awaiting_validation').length;
  const overdueTasks = tasks.filter(t => 
    t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed' && t.status !== 'approved'
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate member productivity
  const memberStats = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assigneeId === member.id);
    const completed = memberTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
    const total = memberTasks.length;
    const overdue = memberTasks.filter(t => 
      t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed' && t.status !== 'approved'
    ).length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...member,
      total,
      completed,
      overdue,
      productivity
    };
  }).sort((a, b) => b.productivity - a.productivity);

  const topPerformer = memberStats.find(m => m.total > 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-gray-500 mt-1">Acompanhe o desempenho da equipe nesta semana</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-500" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalTasks}</p>
          <p className="text-sm text-gray-500">Tarefas criadas</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              completionRate >= 70 ? "bg-green-100 text-green-700" : 
              completionRate >= 40 ? "bg-yellow-100 text-yellow-700" : 
              "bg-red-100 text-red-700"
            )}>
              {completionRate}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{completedTasks}</p>
          <p className="text-sm text-gray-500">Concluídas</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-blue-500" />
            <span className="text-xs text-gray-400">Em andamento</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{inProgressTasks}</p>
          <p className="text-sm text-gray-500">Em progresso</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              overdueTasks === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {overdueTasks === 0 ? 'OK' : 'Atenção'}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{overdueTasks}</p>
          <p className="text-sm text-gray-500">Atrasadas</p>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Task Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Distribuição de Tarefas
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Planejadas</span>
                <span className="text-sm font-medium text-gray-800">{plannedTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (plannedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Em Andamento</span>
                <span className="text-sm font-medium text-gray-800">{inProgressTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Aguardando Validação</span>
                <span className="text-sm font-medium text-gray-800">{awaitingValidation}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (awaitingValidation / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Concluídas</span>
                <span className="text-sm font-medium text-gray-800">{completedTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Completion Rate Visual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Taxa de Conclusão
          </h2>
          
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                    "transition-all duration-1000",
                    completionRate >= 70 ? "text-green-500" : 
                    completionRate >= 40 ? "text-yellow-500" : 
                    "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{completionRate}%</span>
                <span className="text-xs text-gray-500">Concluído</span>
              </div>
            </div>
          </div>

          {topPerformer && topPerformer.productivity > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Destaque da Semana</p>
                <p className="text-sm text-gray-600">{topPerformer.avatar} {topPerformer.name} - {topPerformer.productivity}% de conclusão</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Productivity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Produtividade por Membro
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Membro</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Concluídas</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Atrasadas</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Produtividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memberStats.map((member, index) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {member.avatar}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                      {index === 0 && member.productivity > 0 && (
                        <Award className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="text-center px-4 py-3 text-gray-600">{member.total}</td>
                  <td className="text-center px-4 py-3">
                    <span className="text-green-600 font-medium">{member.completed}</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={cn(
                      "font-medium",
                      member.overdue > 0 ? "text-red-600" : "text-gray-400"
                    )}>
                      {member.overdue}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            member.productivity >= 70 ? "bg-green-500" : 
                            member.productivity >= 40 ? "bg-yellow-500" : 
                            "bg-red-500"
                          )}
                          style={{ width: `${member.productivity}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-10 text-right">
                        {member.productivity}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
