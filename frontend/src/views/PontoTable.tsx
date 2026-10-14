import React, { useEffect, useState } from 'react';
import { Clock, Download, RefreshCw, Calendar } from 'lucide-react';
import { biometryService } from '../services/biometryService';
import { formatarDataBrasilia, formatarHoraBrasilia, isHojeEmBrasilia } from '../utils/brasiliaTime';
import type { RegistroPonto } from '../services/types';

export const PontoTable: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const data = await biometryService.getRegistros();
      setRegistros(data);
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const exportarCSV = () => {
    const header = ['Colaborador', 'ID', 'Setor', 'Data (Brasília)', 'Entrada', 'Saída', 'Permanência', 'Status'];
    const rows = registros.map(r => {
      const dur = r.duracao_minutos ?? 0;
      const durStr = dur > 0 ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m` : '-';
      const ehHoje = isHojeEmBrasilia(r.data_registro);
      const statusStr = r.hora_saida ? 'Concluído' : ehHoje ? 'No Galpão' : 'Sem Saída (Esqueceu)';
      return [
        r.usuario_nome,
        r.usuario_id,
        r.setor,
        formatarDataBrasilia(r.data_registro),
        r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-',
        r.hora_saida ? formatarHoraBrasilia(r.hora_saida) : '-',
        durStr,
        statusStr
      ];
    });
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_pontos_brasilia_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Topo Clean */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Histórico Geral de Presenças
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Horários sincronizados com o Horário Oficial de Brasília (GMT-3)
          </p>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={fetchRegistros}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-300 transition text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            disabled={registros.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20 transition text-xs font-bold disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Setor</th>
                <th className="px-6 py-4">Data (Brasília)</th>
                <th className="px-6 py-4 text-center">Entrada</th>
                <th className="px-6 py-4 text-center">Saída</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs">Carregando histórico...</span>
                    </div>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span className="text-xs">Nenhum registro de ponto encontrado.</span>
                  </td>
                </tr>
              ) : (
                registros.map((reg) => {
                  const ehHoje = isHojeEmBrasilia(reg.data_registro);
                  const dur = reg.duracao_minutos ?? 0;
                  const durStr = dur > 0 ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m` : null;

                  return (
                    <tr key={reg.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{reg.usuario_nome}</div>
                        <div className="text-[11px] text-slate-400 font-mono">#{reg.usuario_id}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {reg.setor}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {formatarDataBrasilia(reg.data_registro)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {formatarHoraBrasilia(reg.hora_entrada)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {reg.hora_saida ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            {formatarHoraBrasilia(reg.hora_saida)}
                          </span>
                        ) : ehHoje ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🟢 No Galpão
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title="Não bateu saída no dia">
                            ⚠️ Sem Saída
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {durStr ? (
                          <span className="text-blue-700 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                            {durStr}
                          </span>
                        ) : ehHoje && !reg.hora_saida ? (
                          <span className="text-emerald-700 text-xs flex items-center justify-center gap-1 font-mono font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Em atividade
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
