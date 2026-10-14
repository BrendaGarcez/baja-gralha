import React, { useState, useEffect } from 'react';
import {
  Cloud,
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
        }
      }
    } catch {
      // Ignora erro se ainda estiver digitando
    }
  };

  const handleSalvar = () => {
    if (!config.apiKey || !config.projectId) {
      return;
    }

    saveFirebaseConfig(config);
    setFirebaseEnabled(useFirebase);
    biometryService.setHardwareUrl(hardwareUrl.trim() || 'http://localhost:5000/');
    resetFirebaseInstance();
    onConfigChanged();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Conexão com a Nuvem (Firebase)
              </h2>
              <p className="text-xs text-slate-500">
                Acesse o sistema de qualquer lugar pela internet e sincronize membros em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Credenciais Firebase
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Leitor Local / Hardware
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'migration'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Migrar do SQLite
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {activeTab === 'config' && (
            <>
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      config.projectId ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      {config.projectId
                        ? `Conectado ao Projeto: ${config.projectId}`
                        : 'Nenhum projeto configurado (Modo Local ativo)'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Banco de dados na nuvem Cloud Firestore
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={useFirebase}
                    onChange={e => setUseFirebase(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Habilitar Firebase</span>
                </label>
              </div>

              {/* Colar Config do Console */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    Colar Código do Console Firebase (Rápido)
                  </label>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    Abrir Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <textarea
                  rows={3}
                  value={jsonInput}
                  onChange={e => handleJsonPaste(e.target.value)}
                  placeholder={'Cole aqui o objeto firebaseConfig do Console Firebase...\nExemplo:\nconst firebaseConfig = { apiKey: "...", projectId: "..." };'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              {/* Campos individuais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Project ID *</label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={e => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="baja-gralha-12345"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">API Key *</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sua_chave_firebase_aqui"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Auth Domain</label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={e => setConfig({ ...config, authDomain: e.target.value })}
                    placeholder="baja-gralha.firebaseapp.com"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Storage Bucket</label>
                  <input
                    type="text"
                    value={config.storageBucket}
                    onChange={e => setConfig({ ...config, storageBucket: e.target.value })}
                    placeholder="baja-gralha.firebasestorage.app"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">App ID</label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={e => setConfig({ ...config, appId: e.target.value })}
                    placeholder="1:12345:web:abcdef"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={config.messagingSenderId}
                    onChange={e => setConfig({ ...config, messagingSenderId: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-950">Como funciona com o sensor na máquina local?</p>
                  <p className="text-blue-800 mt-1 leading-relaxed">
                    Quando você acessa o site pela internet, a página roda no navegador do seu dispositivo. 
                    Se você estiver no computador da oficina (com o sensor USB conectado), a página se comunica com o serviço C# rodando em <code>http://localhost:5000/</code>. 
                    Assim, o ponto é capturado localmente e sincronizado diretamente no Cloud Firestore!
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Endereço do Serviço do Sensor Biométrico (C#)
                </label>
                <input
                  type="text"
                  value={hardwareUrl}
                  onChange={e => setHardwareUrlState(e.target.value)}
                  placeholder="http://localhost:5000/"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                />
                <p className="text-[11px] text-slate-500">
                  Padrão: <code>http://localhost:5000/</code> (computador local da oficina). Se o sensor estiver em outro computador na rede local, você pode colocar o IP dele (ex: <code>http://192.168.1.50:5000/</code>).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" /> Transferir dados existentes para a nuvem
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Se você já cadastrou membros ou possui registros no banco de dados local SQLite (FastAPI), 
                  este botão copia todos os membros e histórico de pontos diretamente para o Cloud Firestore no Firebase!
                </p>
              </div>

              <button
                type="button"
                disabled={migrando || !config.projectId}
                onClick={handleMigrarDoSQLite}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                  {migrationFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              handleSalvar();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 transition"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
