import { useState } from 'react';
import { Fingerprint, Users, Calendar, Flame, BarChart3, Clock } from 'lucide-react';
import { PunchClockTab } from './views/PunchClockTab';
import { MembersTab } from './views/MembersTab';
import { PontoTable } from './views/PontoTable';
import { CalendarTab } from './views/CalendarTab';
import { MonthlyReportTab } from './views/MonthlyReportTab';

type ActiveTab = 'PONTO' | 'CADASTRO' | 'RELATORIO' | 'HISTORICO' | 'CALENDARIO';

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'PONTO',     label: 'Bater Ponto',       icon: <Fingerprint className="w-4 h-4" /> },
  { id: 'CADASTRO',  label: 'Membros',            icon: <Users className="w-4 h-4" /> },
  { id: 'RELATORIO', label: 'Relatórios & Setor', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'HISTORICO', label: 'Histórico',          icon: <Clock className="w-4 h-4" /> },
  { id: 'CALENDARIO',label: 'Calendário',         icon: <Calendar className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PONTO');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header Clean & Blue */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-slate-900">BAJA GRALHA</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistema de Gerenciamento & Ponto Biométrico
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200/80 rounded-xl overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'PONTO'      && <PunchClockTab />}
        {activeTab === 'CADASTRO'   && <MembersTab />}
        {activeTab === 'RELATORIO'  && <MonthlyReportTab />}
        {activeTab === 'HISTORICO'  && <PontoTable />}
        {activeTab === 'CALENDARIO' && <CalendarTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 bg-white">
        Baja Gralha SAE • Sistema de Gerenciamento & Ponto Biométrico
      </footer>
    </div>
  );
}
