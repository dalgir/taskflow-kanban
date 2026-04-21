import { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  Cloud,
  HardDrive,
  Check,
  AlertCircle,
  RefreshCw,
  FileJson,
  Settings as SettingsIcon,
  X,
  Info
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { databaseService } from '../services/database';
import { isFirebaseConfigured } from '../config/firebase';
import { cn } from '../utils/cn';

export default function Settings() {
  const {
    tasks,
    teamMembers,
    absences,
    notifications,
    importData,
    isAdmin,
    firebaseEnabled
  } = useApp();

  const userIsAdmin = isAdmin();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFirebase = databaseService.isUsingFirebase();
  const firebaseConfigured = isFirebaseConfigured() || firebaseEnabled;

  const showTimedMessage = (
    nextMessage: { type: 'success' | 'error' | 'info'; text: string },
    duration = 3000
  ) => {
    setMessage(nextMessage);
    setTimeout(() => setMessage(null), duration);
  };

  const handleExport = () => {
    if (!userIsAdmin) {
      showTimedMessage({
        type: 'error',
        text: 'A exportação completa de dados é permitida apenas para administradores.'
      });
      return;
    }

    setIsExporting(true);

    try {
      const data = { tasks, teamMembers, absences, notifications };
      const date = new Date().toISOString().split('T')[0];
      databaseService.downloadBackup(data, `taskflow_backup_${date}.json`);

      showTimedMessage({
        type: 'success',
        text: 'Backup exportado com sucesso!'
      });
    } catch {
      showTimedMessage({
        type: 'error',
        text: 'Erro ao exportar backup.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (!userIsAdmin) {
      showTimedMessage({
        type: 'error',
        text: 'A importação de backup é permitida apenas para administradores.'
      });
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userIsAdmin) {
      showTimedMessage({
        type: 'error',
        text: 'A importação de backup é permitida apenas para administradores.'
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = databaseService.importAllData(text);

      if (data) {
        importData(data);
        showTimedMessage({
          type: 'success',
          text: 'Dados importados com sucesso!'
        });
      } else {
        showTimedMessage({
          type: 'error',
          text: 'Arquivo inválido. Verifique o formato JSON.'
        });
      }
    } catch {
      showTimedMessage({
        type: 'error',
        text: 'Erro ao importar arquivo.'
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSyncToCloud = async () => {
    if (!userIsAdmin) {
      showTimedMessage({
        type: 'error',
        text: 'A sincronização completa é permitida apenas para administradores.'
      });
      return;
    }

    if (!isFirebase) {
      showTimedMessage({
        type: 'info',
        text: 'Configure o Firebase para sincronizar na nuvem.'
      });
      return;
    }

    try {
      await databaseService.saveTasks(tasks);
      await databaseService.saveTeamMembers(teamMembers);
      await Promise.all(absences.map(absence => databaseService.saveAbsence(absence)));
      await databaseService.saveNotifications(notifications);

      showTimedMessage({
        type: 'success',
        text: 'Dados sincronizados com o Firebase!'
      });
    } catch {
      showTimedMessage({
        type: 'error',
        text: 'Erro ao sincronizar.'
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100"
        title="Configurações e Backup"
      >
        <Database className="h-5 w-5" />
        <span className="hidden md:inline">Dados</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-dvh w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-3xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                        <SettingsIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold sm:text-xl">
                          Configurações de Dados
                        </h2>
                        <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
                          Backup, restauração e sincronização do sistema.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowModal(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/20"
                    aria-label="Fechar configurações"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="space-y-5">
                  {/* Status do Banco */}
                  <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 sm:text-base">
                      <Database className="h-5 w-5 text-blue-600" />
                      Status do armazenamento
                    </h3>

                    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                      {isFirebase ? (
                        <>
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                            <Cloud className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-700">
                              Firebase conectado
                            </p>
                            <p className="text-sm text-gray-500">
                              Dados sincronizados na nuvem.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                            <HardDrive className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-amber-700">
                              Armazenamento local
                            </p>
                            <p className="text-sm text-gray-500">
                              Dados salvos no navegador.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {!firebaseConfigured && (
                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">
                              Como conectar ao Firebase:
                            </p>
                            <ol className="mt-2 list-decimal list-inside space-y-1 text-blue-700">
                              <li>
                                Crie um projeto no{' '}
                                <a
                                  href="https://console.firebase.google.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  Firebase Console
                                </a>
                              </li>
                              <li>Configure as variáveis de ambiente no arquivo .env</li>
                              <li>Reinicie a aplicação</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Estatísticas */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-800 sm:text-base">
                      Resumo dos dados
                    </h3>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-blue-50 p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {tasks.length}
                        </p>
                        <p className="mt-1 text-xs font-medium text-blue-800">
                          Tarefas
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {teamMembers.length}
                        </p>
                        <p className="mt-1 text-xs font-medium text-green-800">
                          Membros
                        </p>
                      </div>

                      <div className="rounded-2xl bg-purple-50 p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {absences.length}
                        </p>
                        <p className="mt-1 text-xs font-medium text-purple-800">
                          Ausências
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {notifications.length}
                        </p>
                        <p className="mt-1 text-xs font-medium text-amber-800">
                          Notificações
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Backup */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 sm:text-base">
                      <FileJson className="h-5 w-5 text-blue-600" />
                      Backup e restauração
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={handleExport}
                        disabled={isExporting || !userIsAdmin}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isExporting ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                        <span>Exportar backup</span>
                      </button>

                      <button
                        onClick={handleImportClick}
                        disabled={isImporting || !userIsAdmin}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isImporting ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                        <span>Importar backup</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />

                    {isFirebase && (
                      <button
                        onClick={handleSyncToCloud}
                        disabled={!userIsAdmin}
                        className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Cloud className="h-5 w-5" />
                        <span>Sincronizar com a nuvem</span>
                      </button>
                    )}
                  </section>

                  {!userIsAdmin && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm leading-6 text-amber-800">
                        Operações administrativas de exportação, importação e
                        sincronização completa foram restritas para reduzir risco
                        de vazamento, sobrescrita indevida e corrupção de dados.
                      </p>
                    </section>
                  )}

                  {/* Google Drive */}
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 sm:text-base">
                      <Cloud className="h-5 w-5 text-blue-600" />
                      Salvar no Google Drive
                    </h3>

                    <p className="mb-3 text-sm text-gray-600">
                      Exporte o backup e faça upload manual para o Google Drive:
                    </p>

                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      <li>Clique em “Exportar backup”.</li>
                      <li>
                        Abra o{' '}
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Google Drive
                        </a>
                      </li>
                      <li>Faça upload do arquivo JSON.</li>
                      <li>
                        Para restaurar, baixe o arquivo e clique em “Importar backup”.
                      </li>
                    </ol>
                  </section>

                  {/* Mensagem */}
                  {message && (
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-2xl border p-4 text-sm',
                        message.type === 'success' &&
                          'border-green-200 bg-green-50 text-green-800',
                        message.type === 'error' &&
                          'border-red-200 bg-red-50 text-red-800',
                        message.type === 'info' &&
                          'border-blue-200 bg-blue-50 text-blue-800'
                      )}
                    >
                      {message.type === 'success' ? (
                        <Check className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : message.type === 'error' ? (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : (
                        <Info className="mt-0.5 h-5 w-5 shrink-0" />
                      )}

                      <span>{message.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* clique fora */}
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="absolute inset-0 -z-10 cursor-default"
            aria-label="Fechar modal"
          />
        </div>
      )}
    </>
  );
}