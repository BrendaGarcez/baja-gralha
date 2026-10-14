import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

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
      tags: ['Planejamento', 'Equipe Completa'],
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
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Treino Técnico
          </span>
        );
      case 'competicao':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Competição SAE
          </span>
        );
      case 'reuniao':
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Reunião Geral
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Topo Limpo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda de Atividades</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cronograma de treinos, reuniões e eventos oficiais da equipe
          </p>
        </div>
      </div>

      {/* Grid de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {eventos.map((ev) => (
          <div
            key={ev.id}
            className="bg-white border border-slate-200 hover:border-blue-300 p-4 rounded-xl shadow-2xs flex flex-col justify-between space-y-3 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-mono text-blue-600 font-semibold">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> {ev.data}
                </span>
                {getCategoriaBadge(ev.categoria)}
              </div>

              <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                {ev.titulo}
              </h3>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{ev.hora}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{ev.local}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
