import { useState } from 'react';
import { Search, Download, Clock, CheckCircle2, Users, Cpu, Gauge } from 'lucide-react';

export const AttendanceTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockRegistros = [
    { id: '101', nome: 'Brenda Garcez', setor: 'Chassi & Suspensão', hora: '14:02:15', status: 'CONFIRMADO' },
    { id: '102', nome: 'Lucas Silva', setor: 'Powertrain', hora: '14:05:40', status: 'CONFIRMADO' },
    { id: '103', nome: 'Mateus Ramos', setor: 'Eletrônica & Telemetria', hora: '14:12:01', status: 'CONFIRMADO' },
    { id: '104', nome: 'Ana Paula Dias', setor: 'Freios', hora: '14:20:18', status: 'CONFIRMADO' },
    { id: '105', nome: 'Gabriel Costa', setor: 'Diretoria & Gestão', hora: '14:35:50', status: 'CONFIRMADO' },
  ];

  const registrosFiltrados = mockRegistros.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.includes(searchTerm) ||
      item.setor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Presentes Hoje</p>
            <p className="text-xl font-bold text-slate-100">18 Membros</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Pico de Presença</p>
            <p className="text-xl font-bold text-slate-100">14:00 - 15:00</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Sensor USB</p>
            <p className="text-xl font-bold text-emerald-400">Online</p>
          </div>
        </div>
      </div>

      {/* Tabela de Presença */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ID, Nome ou Subsistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => alert('Exportação em CSV será vinculada ao endpoint de relatórios da API FastAPI.')}
            className="w-full sm:w-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Relatório (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Membro</th>
                <th className="p-3.5">Subsistema</th>
                <th className="p-3.5">Horário do Registro</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {registrosFiltrados.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                      {item.nome.charAt(0)}
                    </div>
                    <span>{item.nome}</span>
                    <span className="text-slate-500 font-mono text-[11px]">#{item.id}</span>
                  </td>
                  <td className="p-3.5 text-slate-400">{item.setor}</td>
                  <td className="p-3.5 font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {item.hora}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/70">
                      <CheckCircle2 className="w-3 h-3" /> {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {registrosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-xs">
                    Nenhum registro encontrado para a busca informada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
