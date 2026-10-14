import { useState } from 'react';
import { Fingerprint, Users, Calendar, BarChart3, Clock } from 'lucide-react';
import { PunchClockTab } from './views/PunchClockTab';
import { MembersTab } from './views/MembersTab';
import { PontoTable } from './views/PontoTable';
import { CalendarTab } from './views/CalendarTab';
import { MonthlyReportTab } from './views/MonthlyReportTab';

type ActiveTab = 'PONTO' | 'CADASTRO' | 'RELATORIO' | 'HISTORICO' | 'CALENDARIO';

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { id: 'PONTO',      label: 'Registrar Ponto', icon: <Fingerprint className="w-4 h-4" /> },
  { id: 'CADASTRO',   label: 'Membros',         icon: <Users className="w-4 h-4" /> },
  { id: 'RELATORIO',  label: 'Relatórios',      icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'HISTORICO',  label: 'Histórico',       icon: <Clock className="w-4 h-4" /> },
  { id: 'CALENDARIO', label: 'Agenda',          icon: <Calendar className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PONTO');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Header Institucional */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Identidade Visual */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs shadow-blue-600/20">
              BG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">BAJA GRALHA</span>
                <span className="text-[10px] text-blue-700 font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200">
                  SAE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Gestão de Equipe & Ponto Eletrônico
              </p>
            </div>
          </div>

          {/* Navegação por Abas (IHC: Consistência e Reconhecimento) */}
          <nav aria-label="Navegação Principal" className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80 overflow-x-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal com espaçamento adequado */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'PONTO'      && <PunchClockTab />}
        {activeTab === 'CADASTRO'   && <MembersTab />}
        {activeTab === 'RELATORIO'  && <MonthlyReportTab />}
        {activeTab === 'HISTORICO'  && <PontoTable />}
        {activeTab === 'CALENDARIO' && <CalendarTab />}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-slate-200 py-3 text-center text-xs text-slate-400 bg-white">
        Baja Gralha SAE · UTFPR
      </footer>
    </div>
  );
}
