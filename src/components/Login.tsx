import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

import { useApp } from '../contexts/AppContext';

import {
  LogIn,
  Users,
  CheckSquare,
  BarChart3,
  Mail,
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Send,
} from 'lucide-react';

import { cn } from '../utils/cn';
import { TeamMember } from '../types';

function LiquidButton({
  member,
  onClick,
}: {
  member: TeamMember;
  onClick: () => void;
}) {
  const [fillLevel, setFillLevel] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFillInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startFill = useCallback(() => {
    setIsHovering(true);
    clearFillInterval();

    intervalRef.current = setInterval(() => {
      setFillLevel((prev) => {
        if (prev >= 100) {
          clearFillInterval();
          return 100;
        }

        return prev + 3;
      });
    }, 25);
  }, [clearFillInterval]);

  const stopFill = useCallback(() => {
    setIsHovering(false);
    clearFillInterval();

    intervalRef.current = setInterval(() => {
      setFillLevel((prev) => {
        if (prev <= 0) {
          clearFillInterval();
          return 0;
        }

        return prev - 4;
      });
    }, 25);
  }, [clearFillInterval]);

  const handleClick = () => {
    setFillLevel(100);

    setTimeout(() => {
      onClick();
    }, 220);
  };

  useEffect(() => {
    return () => clearFillInterval();
  }, [clearFillInterval]);

  const isAdmin = member.isAdmin;

  const borderColor = isAdmin
    ? 'rgba(245,158,11,0.55)'
    : 'rgba(59,130,246,0.45)';

  const bgColor = isAdmin
    ? 'rgba(245,158,11,0.08)'
    : 'rgba(59,130,246,0.05)';

  const fillGradient = isAdmin
    ? 'linear-gradient(to top, #f59e0b, #fbbf24, #fcd34d)'
    : 'linear-gradient(to top, #2563eb, #60a5fa, #93c5fd)';

  const textColorEmpty = isAdmin ? '#b45309' : '#1d4ed8';
  const textColorFull = '#ffffff';

  const textColor =
    fillLevel > 50
      ? textColorFull
      : textColorEmpty;

  return (
    <button
      type="button"
      onMouseEnter={startFill}
      onMouseLeave={stopFill}
      onClick={handleClick}
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-transform"
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        transform: isHovering ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isHovering
          ? isAdmin
            ? '0 14px 36px rgba(245,158,11,0.20)'
            : '0 14px 36px rgba(59,130,246,0.20)'
          : '0 8px 24px rgba(15,23,42,0.08)',
      }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: fillGradient,
          transform: `translateY(${100 - fillLevel}%)`,
          transition: 'transform 0.05s linear',
        }}
      />

      {fillLevel > 0 && fillLevel < 100 && (
        <>
          <div
            className="pointer-events-none absolute left-0 right-0 z-[1] h-4"
            style={{
              top: `calc(${100 - fillLevel}% - 8px)`,
            }}
          >
            <svg
              viewBox="0 0 1440 48"
              className="h-full w-full"
              style={{
                animation: 'wave 1s ease-in-out infinite',
              }}
              preserveAspectRatio="none"
            >
              <path
                fill={isAdmin ? '#fbbf24' : '#60a5fa'}
                fillOpacity="0.8"
                d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
              />
            </svg>
          </div>

          <div
            className="absolute z-[2] h-2 w-2 animate-bounce rounded-full"
            style={{
              bottom: `${fillLevel - 10}%`,
              left: '20%',
              background: 'rgba(255,255,255,0.6)',
              animationDuration: '0.8s',
            }}
          />

          <div
            className="absolute z-[2] h-1.5 w-1.5 animate-bounce rounded-full"
            style={{
              bottom: `${fillLevel - 15}%`,
              left: '70%',
              background: 'rgba(255,255,255,0.5)',
              animationDuration: '1s',
              animationDelay: '0.2s',
            }}
          />

          <div
            className="absolute z-[2] h-1 w-1 animate-bounce rounded-full"
            style={{
              bottom: `${fillLevel - 5}%`,
              left: '45%',
              background: 'rgba(255,255,255,0.4)',
              animationDuration: '0.6s',
              animationDelay: '0.4s',
            }}
          />
        </>
      )}

      <div
        className="relative z-10 flex min-h-[112px] items-center gap-3 px-4 py-4 sm:min-h-[118px] sm:px-5"
        style={{
          color: textColor,
          transition: 'color 0.25s ease',
        }}
      >
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 text-2xl transition-all duration-300',
            fillLevel > 50
              ? 'border-white/70 shadow-lg'
              : isAdmin
                ? 'border-amber-300'
                : 'border-blue-300'
          )}
          style={{
            backgroundColor:
              fillLevel > 50
                ? 'rgba(255,255,255,0.22)'
                : isAdmin
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(59,130,246,0.15)',
          }}
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

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-bold sm:text-lg">
              {member.name}
            </p>

            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all duration-300"
                style={{
                  backgroundColor:
                    fillLevel > 50
                      ? 'rgba(255,255,255,0.26)'
                      : '#fbbf24',
                  color:
                    fillLevel > 50
                      ? '#ffffff'
                      : '#78350f',
                }}
              >
                <ShieldCheck className="h-3 w-3" />
                ADMIN
              </span>
            )}
          </div>

          <p
            className="mb-2 text-sm"
            style={{
              opacity: fillLevel > 50 ? 0.92 : 0.75,
            }}
          >
            {member.role}
          </p>

          <div
            className="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm"
            style={{
              opacity: 0.88,
            }}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate">
              {member.email}
            </span>
          </div>
        </div>

        {isHovering &&
          fillLevel > 0 &&
          fillLevel < 100 && (
            <div
              className="absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold transition-all duration-300"
              style={{
                backgroundColor:
                  fillLevel > 50
                    ? 'rgba(255,255,255,0.3)'
                    : bgColor,
                color: textColor,
                border: `1px solid ${
                  fillLevel > 50
                    ? 'rgba(255,255,255,0.5)'
                    : borderColor
                }`,
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
  const {
    login,
    register,
    teamMembers,
    firebaseEnabled,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isFirstAccessMode, setIsFirstAccessMode] =
    useState(false);

  const passwordInputRef =
    useRef<HTMLInputElement>(null);

  const activeMembers =
    teamMembers.filter(
      (member) =>
        member.isActive !== false
    );

  const selectedMember =
    activeMembers.find(
      (member) =>
        member.email
          .trim()
          .toLowerCase() ===
        email
          .trim()
          .toLowerCase()
    );

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    clearMessages();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        'Por favor, insira seu e-mail.'
      );

      return;
    }

    if (
      firebaseEnabled &&
      !password.trim()
    ) {
      setError(
        'Por favor, insira sua senha.'
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const result =
        await login(
          normalizedEmail,
          password
        );

      if (!result.success) {
        setError(
          result.message ||
            'Não foi possível autenticar o usuário.'
        );
      }
    } catch (error) {
      console.error(
        'Erro ao realizar login:',
        error
      );

      setError(
        'Ocorreu um erro ao tentar entrar no sistema.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * ========================================
   * PRIMEIRO ACESSO
   * ========================================
   *
   * Agora não criamos conta.
   *
   * O usuário já existe no Firebase.
   *
   * Apenas enviamos o link de definição
   * de senha para o e-mail dele.
   */
  const handleFirstAccess = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    clearMessages();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!firebaseEnabled) {
      setError(
        'O Firebase precisa estar configurado para usar o primeiro acesso.'
      );

      return;
    }

    if (!normalizedEmail) {
      setError(
        'Selecione seu usuário ou informe seu e-mail.'
      );

      return;
    }

    const member =
      activeMembers.find(
        (item) =>
          item.email
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );

    /*
     * O e-mail precisa existir
     * entre os membros ativos
     * mostrados pelo sistema.
     */
    if (!member) {
      setError(
        'Este e-mail não está entre os usuários ativos do TaskFlow.'
      );

      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * O AppContext mantém o nome
       * "register" para não quebrar
       * a estrutura atual.
       *
       * O segundo argumento não é
       * utilizado nesse novo fluxo.
       */
      const result =
        await register(
          normalizedEmail,
          ''
        );

      if (!result.success) {
        setError(
          result.message ||
            'Não foi possível enviar o link para criação da senha.'
        );

        return;
      }

      setSuccess(
        result.message ||
          'Enviamos o link para seu e-mail.'
      );
    } catch (error) {
      console.error(
        'Erro no primeiro acesso:',
        error
      );

      setError(
        'Não foi possível enviar o link de criação da senha.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMember = (
    member: TeamMember
  ) => {
    setEmail(member.email);
    setPassword('');

    clearMessages();

    if (isFirstAccessMode) {
      setSuccess(
        `Usuário selecionado: ${member.name}. Clique em "Enviar link para criar senha".`
      );

      return;
    }

    if (firebaseEnabled) {
      setSuccess(
        `Usuário selecionado: ${member.name}. Agora informe sua senha.`
      );
    } else {
      setSuccess(
        'Modo local ativo. Configure o Firebase para habilitar autenticação segura.'
      );
    }

    setTimeout(() => {
      passwordInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      passwordInputRef.current?.focus();
    }, 250);
  };

  const openFirstAccessMode = () => {
    clearMessages();

    setPassword('');
    setIsFirstAccessMode(true);
  };

  const returnToLogin = () => {
    clearMessages();

    setPassword('');
    setIsFirstAccessMode(false);

    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(-5%);
          }
        }
      `}</style>

      <div className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8">

        {/* Coluna esquerda */}
        <div className="order-2 space-y-6 text-white lg:order-1 lg:space-y-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Plataforma interna de gestão semanal
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              TaskFlow
            </h1>

            <p className="mt-3 text-lg font-medium text-blue-100 sm:text-xl">
              Gestão de Tarefas Semanais
            </p>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/90 sm:text-base">
              Organize sua equipe, acompanhe o progresso das demandas e centralize
              tarefas, validações e produtividade em um único sistema.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4">

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="rounded-xl bg-white/15 p-3">
                <CheckSquare className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Quadro Kanban
                </h3>

                <p className="mt-1 text-sm text-blue-100">
                  Visualize todas as tarefas da semana com clareza.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="rounded-xl bg-white/15 p-3">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Gestão de Equipe
                </h3>

                <p className="mt-1 text-sm text-blue-100">
                  Distribua responsabilidades e acompanhe cada membro.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="rounded-xl bg-white/15 p-3">
                <BarChart3 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Relatórios e controle
                </h3>

                <p className="mt-1 text-sm text-blue-100">
                  Tenha uma visão mais clara da execução e produtividade.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-300" />

              <h3 className="font-semibold text-amber-200">
                Sistema de permissões
              </h3>
            </div>

            <div className="space-y-2.5 text-sm">

              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                <p className="text-blue-100">
                  <strong className="text-amber-200">
                    Administradores:
                  </strong>{' '}
                  gerenciam usuários, tarefas, banco, validações e regras do sistema.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />

                <p className="text-blue-100">
                  <strong className="text-blue-200">
                    Membros:
                  </strong>{' '}
                  operam apenas tarefas, ausências e notificações permitidas no fluxo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="order-1 lg:order-2">
          <div className="rounded-3xl border border-white/20 bg-white p-5 shadow-2xl sm:p-6 lg:p-8">

            <div className="mb-6 text-center sm:mb-8">
              <div
                className={cn(
                  'mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl',
                  isFirstAccessMode
                    ? 'bg-emerald-100'
                    : 'bg-blue-100'
                )}
              >
                {isFirstAccessMode ? (
                  <KeyRound className="h-8 w-8 text-emerald-600" />
                ) : (
                  <LogIn className="h-8 w-8 text-blue-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {isFirstAccessMode
                  ? 'Primeiro acesso'
                  : 'Entrar no sistema'}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {isFirstAccessMode
                  ? 'Selecione seu usuário e enviaremos para seu e-mail o link oficial do Firebase para você definir sua senha.'
                  : firebaseEnabled
                    ? 'Selecione um usuário ativo, confirme o e-mail e informe sua senha para autenticar.'
                    : 'Modo local de demonstração ativo. Configure o Firebase para habilitar autenticação segura.'}
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Usuários ativos
              </p>

              <div className="space-y-3">
                {activeMembers.map((member) => (
                  <LiquidButton
                    key={member.id}
                    member={member}
                    onClick={() =>
                      handleSelectMember(member)
                    }
                  />
                ))}
              </div>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>

              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="bg-white px-4 text-gray-500">
                  {isFirstAccessMode
                    ? 'definir senha'
                    : 'acesso autenticado'}
                </span>
              </div>
            </div>

            {!isFirstAccessMode ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    E-mail
                  </label>

                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearMessages();
                    }}
                    placeholder="Digite seu e-mail corporativo"
                    autoComplete="username"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Senha
                  </label>

                  <input
                    ref={passwordInputRef}
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearMessages();
                    }}
                    placeholder={
                      firebaseEnabled
                        ? 'Digite sua senha'
                        : 'Senha opcional no modo local'
                    }
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {success}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  <LogIn className="h-5 w-5" />

                  {isSubmitting
                    ? 'Autenticando...'
                    : 'Entrar'}
                </button>

                {firebaseEnabled && (
                  <div className="pt-2 text-center">
                    <p className="mb-2 text-xs text-gray-500">
                      Primeiro acesso ou esqueceu sua senha?
                    </p>

                    <button
                      type="button"
                      onClick={openFirstAccessMode}
                      className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      <KeyRound className="h-4 w-4" />
                      Criar / redefinir minha senha
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <form
                onSubmit={handleFirstAccess}
                className="space-y-4"
              >
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                  <strong>
                    Como funciona:
                  </strong>{' '}
                  escolha seu usuário acima. O Firebase enviará um link para o e-mail cadastrado. Você abrirá esse link e escolherá sua própria senha.
                </div>

                <div>
                  <label
                    htmlFor="first-access-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    E-mail
                  </label>

                  <input
                    type="email"
                    id="first-access-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearMessages();
                    }}
                    placeholder="Selecione seu usuário acima"
                    autoComplete="username"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />

                  {selectedMember && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Usuário identificado: {selectedMember.name}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                    <p className="text-xs leading-5 text-gray-600">
                      A senha será definida diretamente pelo Firebase Authentication. O TaskFlow não recebe nem armazena sua senha.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {success}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  <Send className="h-5 w-5" />

                  {isSubmitting
                    ? 'Enviando link...'
                    : 'Enviar link para criar senha'}
                </button>

                <button
                  type="button"
                  onClick={returnToLogin}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Voltar para entrar
                </button>
              </form>
            )}

            <div
              className={cn(
                'mt-6 rounded-2xl border p-4',
                firebaseEnabled
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              )}
            >
              <p
                className={cn(
                  'text-center text-xs leading-5',
                  firebaseEnabled
                    ? 'text-emerald-800'
                    : 'text-amber-800'
                )}
              >
                <strong>
                  {firebaseEnabled
                    ? 'Modo seguro:'
                    : 'Modo local:'}
                </strong>{' '}

                {firebaseEnabled
                  ? 'o acesso depende do Firebase Authentication e do cadastro ativo do usuário no TaskFlow.'
                  : 'utilize apenas para demonstração. Sem Firebase não há autenticação segura.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}