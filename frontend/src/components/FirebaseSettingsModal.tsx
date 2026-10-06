import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Database,
  Radio,
  ExternalLink,
  UploadCloud,
  Loader2,
  X,
  Copy,
  Info
} from 'lucide-react';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseEnabled,
  setFirebaseEnabled,
  resetFirebaseInstance,
  type FirebaseConfigParams,
} from '../services/firebaseConfig';
import { firebaseService } from '../services/firebaseService';
import { biometryService } from '../services/biometryService';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const FirebaseSettingsModal: React.FC<FirebaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [config, setConfig] = useState<FirebaseConfigParams>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [jsonInput, setJsonInput] = useState('');
  const [hardwareUrl, setHardwareUrlState] = useState('');
  const [useFirebase, setUseFirebase] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'migration' | 'hardware'>('config');

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [migrando, setMigrando] = useState(false);
  const [migrationFeedback, setMigrationFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedFirebaseConfig();
      if (saved) {
        setConfig(saved);
        setJsonInput(JSON.stringify(saved, null, 2));
      }
      setUseFirebase(isFirebaseEnabled());
      setHardwareUrlState(biometryService.getHardwareUrl());
      setTestStatus({ loading: false });
      setMigrationFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJsonPaste = (text: string) => {
    setJsonInput(text);
    try {
      // Tenta extrair pares chave-valor mesmo se colado código JS (ex: const firebaseConfig = { ... })
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Converte sintaxe de objeto JS para JSON válido se necessário
        const jsonStr = jsonMatch[0]
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        if (parsed.apiKey && parsed.projectId) {
          setConfig({
            apiKey: parsed.apiKey || '',
            authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
            projectId: parsed.projectId || '',
            storageBucket: parsed.storageBucket || `${parsed.projectId}.firebasestorage.app`,
            messagingSenderId: parsed.messagingSenderId || '',
            appId: parsed.appId || '',
          });
          setTestStatus({
            loading: false,
            success: true,
            message: 'Configuração detectada e preenchida com sucesso!',
          });
        }
      }
    } catch {
      // Ignora erro se ainda estiver digitando
    }
  };

  const handleSalvar = () => {
    if (!config.apiKey || !config.projectId) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Preencha ao menos o apiKey e o projectId do Firebase.',
      });
      return;
    }

    saveFirebaseConfig(config);
    setFirebaseEnabled(useFirebase);
    biometryService.setHardwareUrl(hardwareUrl.trim() || 'http://localhost:5000/');
    resetFirebaseInstance();
    onConfigChanged();
    setTestStatus({
      loading: false,
      success: true,
      message: 'Configurações salvas com sucesso!',
    });
  };

  const handleTestarConexao = async () => {
    setTestStatus({ loading: true });
    try {
      // Salva temporariamente para testar
      saveFirebaseConfig(config);
      setFirebaseEnabled(true);
      resetFirebaseInstance();

      const usuarios = await firebaseService.getUsuarios();
      setTestStatus({
        loading: false,
        success: true,
        message: `Conexão bem sucedida com o Cloud Firestore! (${usuarios.length} membros carregados)`,
      });
      onConfigChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o Firestore.';
      setTestStatus({
        loading: false,
        success: false,
        message: `Erro ao conectar: ${msg}`,
      });
    }
  };

  const handleMigrarDoSQLite = async () => {
    setMigrando(true);
    setMigrationFeedback(null);
    try {
      setMigrationFeedback('Buscando membros e pontos do backend local...');
      const localData = await biometryService.fetchLocalDataForMigration();

      setMigrationFeedback(`Enviando ${localData.usuarios.length} membros e ${localData.registros.length} registros para o Cloud Firestore...`);
      const res = await firebaseService.migrarDadosDoLocal(localData.usuarios, localData.registros);

      setMigrationFeedback(`Sucesso! Migrados ${res.usuariosMigrados} membros e ${res.registrosMigrados} registros com sucesso para a nuvem.`);
      onConfigChanged();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro na migração';
      setMigrationFeedback(`Falha na migração: ${msg}. Verifique se o FastAPI local (porta 8083) está ligado.`);
    } finally {
      setMigrando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-[1px] shadow-lg shadow-amber-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-amber-400">
                <Cloud className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Conexão com a Nuvem (Firebase)
              </h2>
              <p className="text-xs text-slate-400">
                Acesse o sistema de qualquer lugar pela internet e sincronize membros em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Credenciais Firebase
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Leitor Local / Hardware
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'migration'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Migrar do SQLite
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'config' && (
            <>
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      config.projectId ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      {config.projectId
                        ? `Conectado ao Projeto: ${config.projectId}`
                        : 'Nenhum projeto configurado (Modo Local ativo)'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Banco de dados na nuvem Cloud Firestore
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={useFirebase}
                    onChange={e => setUseFirebase(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Habilitar Firebase</span>
                </label>
              </div>

              {/* Colar Config do Console */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    Colar Código do Console Firebase (Rápido)
                  </label>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Abrir Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <textarea
                  rows={3}
                  value={jsonInput}
                  onChange={e => handleJsonPaste(e.target.value)}
                  placeholder={'Cole aqui o objeto firebaseConfig do Console Firebase...\nExemplo:\nconst firebaseConfig = { apiKey: "...", projectId: "..." };'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Campos individuais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Project ID *</label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={e => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="baja-gralha-12345"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">API Key *</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Auth Domain</label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={e => setConfig({ ...config, authDomain: e.target.value })}
                    placeholder="baja-gralha.firebaseapp.com"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Storage Bucket</label>
                  <input
                    type="text"
                    value={config.storageBucket}
                    onChange={e => setConfig({ ...config, storageBucket: e.target.value })}
                    placeholder="baja-gralha.firebasestorage.app"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">App ID</label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={e => setConfig({ ...config, appId: e.target.value })}
                    placeholder="1:12345:web:abcdef"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={config.messagingSenderId}
                    onChange={e => setConfig({ ...config, messagingSenderId: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {testStatus.message && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                    testStatus.success
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Como funciona com o sensor na máquina local?</p>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Quando você acessa o site pela internet, a página roda no navegador do seu dispositivo. 
                    Se você estiver no computador da oficina (com o sensor USB conectado), a página se comunica com o serviço C# rodando em <code>http://localhost:5000/</code>. 
                    Assim, o ponto é capturado localmente e enviado imediatamente para o Firebase na nuvem!
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Endereço do Serviço do Sensor Biométrico (C#)
                </label>
                <input
                  type="text"
                  value={hardwareUrl}
                  onChange={e => setHardwareUrlState(e.target.value)}
                  placeholder="http://localhost:5000/"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400">
                  Padrão: <code>http://localhost:5000/</code> (computador local da oficina). Se o sensor estiver em outro computador na rede local, você pode colocar o IP dele (ex: <code>http://192.168.1.50:5000/</code>).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" /> Transferir dados existentes para a nuvem
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Se você já cadastrou membros ou possui registros no banco de dados local SQLite (FastAPI), 
                  este botão copia todos os membros e histórico de pontos diretamente para o Cloud Firestore no Firebase!
                </p>
              </div>

              <button
                type="button"
                disabled={migrando || !config.projectId}
                onClick={handleMigrarDoSQLite}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {migrando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Migrando dados...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Copiar Membros do SQLite para o Firebase
                  </>
                )}
              </button>

              {migrationFeedback && (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
                  {migrationFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestarConexao}
            disabled={testStatus.loading || !config.apiKey}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
          >
            {testStatus.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Testar Conexão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                handleSalvar();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-md shadow-amber-950/50 transition"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
