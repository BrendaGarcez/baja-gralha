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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3 h-3 text-blue-600" /> Treino Técnico
          </span>
        );
      case 'competicao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Flag className="w-3 h-3 text-rose-600" /> Competição SAE
          </span>
        );
      case 'reuniao':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-600" /> Reunião Geral
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Calendário de Atividades & Treinos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cronograma de montagens, sessões de dinamômetro e competições da equipe Baja Gralha.
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Agendamento de novos eventos disponível em breve.')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" /> Agendar Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {eventos.map((ev) => (
          <div
            key={ev.id}
            className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md p-5 rounded-2xl transition space-y-3.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold font-mono">
                <CalendarIcon className="w-4 h-4 text-blue-600" /> {ev.data}
              </div>
              {getCategoriaBadge(ev.categoria)}
            </div>

            <h4 className="font-bold text-slate-900 text-sm leading-snug">{ev.titulo}</h4>

            <div className="space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Horário:</span> {ev.hora}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {ev.local}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {ev.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-0.5 bg-slate-50 text-slate-600 text-[11px] rounded-md border border-slate-200 font-medium"
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
