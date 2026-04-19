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

export default function Settings() {
  const { tasks, teamMembers, absences, notifications, importData, isAdmin, firebaseEnabled } = useApp();
  const userIsAdmin = isAdmin();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFirebase = databaseService.isUsingFirebase();
  const firebaseConfigured = isFirebaseConfigured() || firebaseEnabled;

  const handleExport = () => {
    if (!userIsAdmin) {
      setMessage({ type: 'error', text: 'A exportação completa de dados é permitida apenas para administradores.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      const data = { tasks, teamMembers, absences, notifications };
      const date = new Date().toISOString().split('T')[0];
      databaseService.downloadBackup(data, `taskflow_backup_${date}.json`);
      setMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao exportar backup.' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImportClick = () => {
    if (!userIsAdmin) {
      setMessage({ type: 'error', text: 'A importação de backup é permitida apenas para administradores.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userIsAdmin) {
      setMessage({ type: 'error', text: 'A importação de backup é permitida apenas para administradores.' });
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = databaseService.importAllData(text);
      
      if (data) {
        importData(data);
        setMessage({ type: 'success', text: 'Dados importados com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Arquivo inválido. Verifique o formato JSON.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao importar arquivo.' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSyncToCloud = async () => {
    if (!userIsAdmin) {
      setMessage({ type: 'error', text: 'A sincronização completa é permitida apenas para administradores.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!isFirebase) {
      setMessage({ type: 'info', text: 'Configure o Firebase para sincronizar na nuvem.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      await databaseService.saveTasks(tasks);
      await databaseService.saveTeamMembers(teamMembers);
      await Promise.all(absences.map(absence => databaseService.saveAbsence(absence)));
      await databaseService.saveNotifications(notifications);
      setMessage({ type: 'success', text: 'Dados sincronizados com o Firebase!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao sincronizar.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Configurações e Backup"
      >
        <Database className="w-5 h-5" />
        <span className="hidden md:inline">Dados</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Configurações de Dados</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status do Banco de Dados */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Status do Armazenamento
                </h3>
                
                <div className="flex items-center gap-3">
                  {isFirebase ? (
                    <>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">Firebase Conectado</p>
                        <p className="text-sm text-gray-500">Dados sincronizados na nuvem</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-700">Armazenamento Local</p>
                        <p className="text-sm text-gray-500">Dados salvos no navegador</p>
                      </div>
                    </>
                  )}
                </div>

                {!firebaseConfigured && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Como conectar ao Firebase:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1 text-blue-700">
                          <li>Crie um projeto em <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                          <li>Configure as variáveis de ambiente no arquivo .env</li>
                          <li>Reinicie a aplicação</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                  <p className="text-xs text-blue-800">Tarefas</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{teamMembers.length}</p>
                  <p className="text-xs text-green-800">Membros</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{absences.length}</p>
                  <p className="text-xs text-purple-800">Ausências</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{notifications.length}</p>
                  <p className="text-xs text-amber-800">Notificações</p>
                </div>
              </div>

              {/* Ações de Backup */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-blue-600" />
                  Backup e Restauração
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting || !userIsAdmin}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>Exportar Backup</span>
                  </button>

                  <button
                    onClick={handleImportClick}
                    disabled={isImporting || !userIsAdmin}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    <span>Importar Backup</span>
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:opacity-50"
                  >
                    <Cloud className="w-5 h-5" />
                    <span>Sincronizar com a Nuvem</span>
                  </button>
                )}
              </div>

              {!userIsAdmin && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Operações administrativas de exportação, importação e sincronização completa foram restritas para reduzir risco de vazamento, sobrescrita indevida e corrupção de dados.
                  </p>
                </div>
              )}

              {/* Google Drive Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  Salvar no Google Drive
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Exporte o backup e faça upload manual para o Google Drive:
                </p>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>Clique em "Exportar Backup"</li>
                  <li>Abra o <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Drive</a></li>
                  <li>Faça upload do arquivo JSON</li>
                  <li>Para restaurar, baixe o arquivo e clique em "Importar Backup"</li>
                </ol>
              </div>

              {/* Mensagem de Feedback */}
              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : message.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : message.type === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
