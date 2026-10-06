import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Plus, Flag, Wrench, ShieldAlert } from 'lucide-react';

interface Evento {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  categoria: 'treino' | 'reuniao' | 'competicao';
  tags: string[];
}

export const CalendarTab = () => {
  const [eventos] = useState<Evento[]>([
    {
      id: 1,
      titulo: 'Validação Dinâmica do Protótipo & Treino de Pilotos',
      data: '18 Set, 2026',
      hora: '13:30',
      local: 'Pista de Testes Off-Road',
      categoria: 'treino',
      tags: ['Dinâmica', 'Powertrain', 'Pilotos'],
    },
    {
      id: 2,
      titulo: 'Reunião Geral: Alinhamento para Etapa Nacional',
      data: '22 Set, 2026',
      hora: '19:00',
      local: 'Oficina Central Baja Gralha',
      categoria: 'reuniao',
      tags: ['Geral', 'Obrigatório', 'Planejamento'],
    },
    {
      id: 3,
      titulo: 'Inspeção Técnica de Segurança e Conformidade SAE',
      data: '05 Out, 2026',
      hora: '08:00',
      local: 'Box Principal do Autódromo',
      categoria: 'competicao',
      tags: ['SAE Brasil', 'Inspeção', 'Freios'],
    },
  ]);

  const getCategoriaBadge = (cat: Evento['categoria']) => {
    switch (cat) {
      case 'treino':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800">
            <Wrench className="w-3 h-3" /> Treino Técnico
          </span>
        );
      case 'competicao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/70 text-rose-300 border border-rose-800">
            <Flag className="w-3 h-3" /> Competição SAE
          </span>
        );
      case 'reuniao':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800">
            <ShieldAlert className="w-3 h-3" /> Reunião Geral
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Calendário de Atividades & Treinos</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cronograma de montagens, sessões de dinamômetro e competições da equipe Baja Gralha.
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Agendamento de novos eventos será sincronizado com a API FastAPI.')}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Agendar Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {eventos.map((ev) => (
          <div
            key={ev.id}
            className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition space-y-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                <CalendarIcon className="w-4 h-4" /> {ev.data}
              </div>
              {getCategoriaBadge(ev.categoria)}
            </div>

            <h4 className="font-semibold text-slate-100 text-sm leading-snug">{ev.titulo}</h4>

            <div className="space-y-1 text-xs text-slate-400">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Horário:</span> {ev.hora}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {ev.local}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
              {ev.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2 py-0.5 bg-slate-800/80 text-slate-300 text-[10px] rounded-md border border-slate-700/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
