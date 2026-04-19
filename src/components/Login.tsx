import { useState, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn, Users, CheckSquare, BarChart3, Mail, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '../utils/cn';
import { TeamMember } from '../types';

// Componente de botão com efeito líquido
function LiquidButton({ 
  member, 
  onClick 
}: { 
  member: TeamMember; 
  onClick: () => void;
}) {
  const [fillLevel, setFillLevel] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFill = useCallback(() => {
    setIsHovering(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFillLevel(prev => {
        if (prev >= 100) { 
          if (intervalRef.current) clearInterval(intervalRef.current); 
          return 100; 
        }
        return prev + 3;
      });
    }, 25);
  }, []);

  const stopFill = useCallback(() => {
    setIsHovering(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFillLevel(prev => {
        if (prev <= 0) { 
          if (intervalRef.current) clearInterval(intervalRef.current); 
          return 0; 
        }
        return prev - 4;
      });
    }, 25);
  }, []);

  const handleClick = () => {
    setFillLevel(100);
    setTimeout(() => {
      onClick();
    }, 300);
  };

  // Cores diferentes para admin e membros
  const isAdmin = member.isAdmin;
  const borderColor = isAdmin ? 'rgba(245,158,11,0.6)' : 'rgba(59,130,246,0.5)';
  const bgColor = isAdmin ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.05)';
  const fillGradient = isAdmin 
    ? 'linear-gradient(to top, #f59e0b, #fbbf24, #fcd34d)' 
    : 'linear-gradient(to top, #3b82f6, #60a5fa, #93c5fd)';
  const textColorEmpty = isAdmin ? '#b45309' : '#1d4ed8';
  const textColorFull = '#ffffff';
  const textColor = fillLevel > 50 ? textColorFull : textColorEmpty;

  return (
    <button 
      onMouseEnter={startFill} 
      onMouseLeave={stopFill}
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-xl group"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        transition: 'all 0.3s ease',
        transform: isHovering ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovering 
          ? isAdmin 
            ? '0 10px 40px rgba(245,158,11,0.3)' 
            : '0 10px 40px rgba(59,130,246,0.3)'
          : '0 4px 15px rgba(0,0,0,0.1)',
      }}
    >
      {/* Liquid fill div */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: fillGradient,
          transform: `translateY(${100 - fillLevel}%)`,
          transition: 'transform 0.05s linear',
        }} 
      />
      
      {/* Wave effect on top of liquid */}
      {fillLevel > 0 && fillLevel < 100 && (
        <>
          <div 
            className="absolute left-0 right-0 z-[1] h-4 pointer-events-none"
            style={{
              top: `calc(${100 - fillLevel}% - 8px)`,
            }}
          >
            <svg 
              viewBox="0 0 1440 48" 
              className="w-full h-full"
              style={{ animation: 'wave 1s ease-in-out infinite' }}
              preserveAspectRatio="none"
            >
              <path 
                fill={isAdmin ? '#fbbf24' : '#60a5fa'}
                fillOpacity="0.8"
                d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
              />
            </svg>
          </div>
          {/* Bubbles */}
          <div 
            className="absolute w-2 h-2 rounded-full z-[2] animate-bounce"
            style={{
              bottom: `${fillLevel - 10}%`,
              left: '20%',
              background: isAdmin ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.6)',
              animationDuration: '0.8s',
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 rounded-full z-[2] animate-bounce"
            style={{
              bottom: `${fillLevel - 15}%`,
              left: '70%',
              background: isAdmin ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.5)',
              animationDuration: '1s',
              animationDelay: '0.2s',
            }}
          />
          <div 
            className="absolute w-1 h-1 rounded-full z-[2] animate-bounce"
            style={{
              bottom: `${fillLevel - 5}%`,
              left: '45%',
              background: isAdmin ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.4)',
              animationDuration: '0.6s',
              animationDelay: '0.4s',
            }}
          />
        </>
      )}
      
      {/* Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center px-4 py-4 text-center"
        style={{ color: textColor, transition: 'color 0.3s ease' }}
      >
        {/* Avatar */}
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 mb-2",
          fillLevel > 50 
            ? "border-white/70 shadow-lg" 
            : isAdmin 
              ? "border-amber-300" 
              : "border-blue-300"
        )}
          style={{
            backgroundColor: fillLevel > 50 
              ? 'rgba(255,255,255,0.25)' 
              : isAdmin 
                ? 'rgba(245,158,11,0.15)' 
                : 'rgba(59,130,246,0.15)'
          }}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            member.avatar
          )}
        </div>
        
        {/* Nome e Badge Admin */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="font-bold text-lg transition-all duration-300">
            {member.name}
          </p>
          {isAdmin && (
            <span 
              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full transition-all duration-300"
              style={{
                backgroundColor: fillLevel > 50 ? 'rgba(255,255,255,0.3)' : '#fbbf24',
                color: fillLevel > 50 ? '#ffffff' : '#78350f',
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              ADMIN
            </span>
          )}
        </div>
        
        {/* Função */}
        <p 
          className="text-sm transition-all duration-300 mb-2"
          style={{ opacity: fillLevel > 50 ? 0.9 : 0.7 }}
        >
          {member.role}
        </p>
        
        {/* Email - sempre visível e centralizado */}
        <div 
          className="flex items-center justify-center gap-1.5 text-xs transition-all duration-300 w-full"
          style={{ opacity: 0.85 }}
        >
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        
        {/* Fill percentage indicator */}
        {isHovering && fillLevel > 0 && fillLevel < 100 && (
          <div 
            className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: fillLevel > 50 ? 'rgba(255,255,255,0.3)' : bgColor,
              color: textColor,
              border: `1px solid ${fillLevel > 50 ? 'rgba(255,255,255,0.5)' : borderColor}`,
            }}
          >
            {Math.round(fillLevel)}%
          </div>
        )}
      </div>
    </button>
  );
}

export function Login() {
  const { login, teamMembers, firebaseEnabled } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembers = teamMembers.filter(member => member.isActive !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, insira seu e-mail.');
      return;
    }

    if (firebaseEnabled && !password.trim()) {
      setError('Por favor, insira sua senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message || 'Não foi possível autenticar o usuário.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = () => {
    setError(firebaseEnabled
      ? 'O acesso rápido agora apenas preenche o e-mail. Informe a senha para concluir a autenticação.'
      : 'Modo local ativo. Configure o Firebase para habilitar autenticação segura com senha.'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5%); }
        }
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-10px) scale(1.1); opacity: 0.8; }
          100% { transform: translateY(0) scale(1); opacity: 0.6; }
        }
      `}</style>

      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-8 p-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">TaskFlow</h1>
            <p className="text-xl text-blue-100 mb-2">Gestão de Tarefas Semanais</p>
            <p className="text-blue-200">
              Organize sua equipe, acompanhe o progresso e garanta que todas as atividades
              sejam executadas com eficiência.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Quadro Kanban</h3>
                <p className="text-blue-100 text-sm">Visualize todas as tarefas da semana</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Gestão de Equipe</h3>
                <p className="text-blue-100 text-sm">Atribua tarefas aos membros</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Relatórios</h3>
                <p className="text-blue-100 text-sm">Acompanhe a produtividade</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <h3 className="font-semibold text-amber-200">Sistema de Permissões</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300 mt-0.5" />
                <p className="text-blue-100">
                  <strong className="text-amber-200">Administradores:</strong> gerenciam usuários, banco, tarefas e validações.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-300 mt-0.5" />
                <p className="text-blue-100">
                  <strong className="text-blue-200">Membros:</strong> operam apenas suas tarefas, ausências e notificações autorizadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Entrar no Sistema</h2>
            <p className="text-gray-500 mt-2">
              {firebaseEnabled
                ? 'Selecione seu usuário, confirme o e-mail e informe sua senha.'
                : 'Modo local de demonstração. Configure o Firebase para ativar autenticação segura.'}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários ativos:
            </p>
            <div className="space-y-3">
              {activeMembers.map(member => (
                <LiquidButton
                  key={member.id}
                  member={member}
                  onClick={() => {
                    setEmail(member.email);
                    handleQuickLogin();
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">acesso autenticado</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail corporativo"
                autoComplete="username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            <div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={firebaseEnabled ? 'Digite sua senha' : 'Senha opcional no modo local'}
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isSubmitting ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className={`mt-6 p-4 rounded-lg border ${firebaseEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-xs text-center ${firebaseEnabled ? 'text-emerald-800' : 'text-amber-800'}`}>
              <strong>{firebaseEnabled ? 'Modo seguro:' : 'Modo local:'}</strong>{' '}
              {firebaseEnabled
                ? 'o acesso depende de autenticação no Firebase e autorização do usuário ativo no sistema.'
                : 'utilize apenas para demonstração. Sem Firebase não há garantias reais de segurança, RLS ou integridade multiusuário.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
