import { useState, useEffect } from 'react';
import { Fingerprint, Users, Calendar, Flame, BarChart3, Clock, Cloud } from 'lucide-react';
import { PunchClockTab } from './views/PunchClockTab';
import { MembersTab } from './views/MembersTab';
import { PontoTable } from './views/PontoTable';
import { CalendarTab } from './views/CalendarTab';
import { MonthlyReportTab } from './views/MonthlyReportTab';
import { FirebaseSettingsModal } from './components/FirebaseSettingsModal';
import { isFirebaseEnabled, getSavedFirebaseConfig } from './services/firebaseConfig';

type ActiveTab = 'PONTO' | 'CADASTRO' | 'RELATORIO' | 'HISTORICO' | 'CALENDARIO';

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'PONTO',     label: 'Bater Ponto',       icon: <Fingerprint className="w-3.5 h-3.5" /> },
  { id: 'CADASTRO',  label: 'Membros',            icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'RELATORIO', label: 'Relatório Mensal',   icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'HISTORICO', label: 'Histórico',          icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'CALENDARIO',label: 'Calendário',         icon: <Calendar className="w-3.5 h-3.5" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PONTO');
  const [modalFirebaseAberto, setModalFirebaseAberto] = useState(false);
  const [firebaseAtivo, setFirebaseAtivo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const checarStatusFirebase = () => {
    const config = getSavedFirebaseConfig();
    setFirebaseAtivo(isFirebaseEnabled() && Boolean(config?.projectId));
  };

  useEffect(() => {
    checarStatusFirebase();
  }, []);

  const handleConfigChanged = () => {
    checarStatusFirebase();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 p-[1px] shadow-lg shadow-cyan-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-400">
                <Flame className="w-5 h-5 fill-cyan-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-widest text-slate-100">BAJA GRALHA</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[9px] font-mono font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Sistema de Gerenciamento & Ponto Biométrico</p>
            </div>
          </div>

          {/* Navegação e Botão de Nuvem */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-0.5 bg-slate-950/80 p-1 border border-slate-800/90 rounded-xl overflow-x-auto scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Botão de Nuvem Firebase */}
            <button
              onClick={() => setModalFirebaseAberto(true)}
              title="Configurar e visualizar status do Firebase na Nuvem"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                firebaseAtivo
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <div className={`w-2 h-2 rounded-full ${firebaseAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden md:inline">
                {firebaseAtivo ? 'Nuvem Firebase' : 'Conectar Firebase'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main key={refreshKey} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'PONTO'      && <PunchClockTab />}
        {activeTab === 'CADASTRO'   && <MembersTab />}
        {activeTab === 'RELATORIO'  && <MonthlyReportTab />}
        {activeTab === 'HISTORICO'  && <PontoTable />}
        {activeTab === 'CALENDARIO' && <CalendarTab />}
      </main>

      {/* Modal de Configuração do Firebase */}
      <FirebaseSettingsModal
        isOpen={modalFirebaseAberto}
        onClose={() => setModalFirebaseAberto(false)}
        onConfigChanged={handleConfigChanged}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-3 text-center text-xs text-slate-500 bg-slate-950">
        Baja Gralha SAE • DigitalPersona U.are.U + C# Service + Cloud Firebase + React
      </footer>
    </div>
  );
}
