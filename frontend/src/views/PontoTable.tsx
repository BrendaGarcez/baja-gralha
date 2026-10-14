import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Calendar, Loader2 } from 'lucide-react';
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
      console.error('Erro ao buscar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const exportarCSV = () => {
    const header = ['Colaborador', 'ID', 'Setor', 'Data', 'Entrada', 'Saída', 'Permanência', 'Status'];
    const rows = registros.map(r => {
      const dur = r.duracao_minutos ?? 0;
      const durStr = dur > 0 ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m` : '-';
      const ehHoje = isHojeEmBrasilia(r.data_registro);
      const statusStr = r.hora_saida ? 'Concluído' : ehHoje ? 'Em andamento' : 'Sem saída';
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
    a.download = `historico_pontos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Topo Limpo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Presenças</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico de todas as batidas de ponto da oficina
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRegistros}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 transition text-xs font-medium shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-600' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            disabled={registros.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-medium shadow-xs shadow-blue-600/20 active:scale-98 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela de Histórico (IHC: Consistência com o restante do sistema) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Colaborador</th>
                <th className="px-4 py-2.5">Setor</th>
                <th className="px-4 py-2.5 text-center">Entrada</th>
                <th className="px-4 py-2.5 text-center">Saída</th>
                <th className="px-4 py-2.5 text-center">Permanência</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span className="text-xs">Carregando histórico...</span>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span className="text-xs">Nenhum registro de ponto encontrado.</span>
                  </td>
                </tr>
              ) : (
                registros.map((reg) => {
                  const ehHoje = isHojeEmBrasilia(reg.data_registro);
                  const dur = reg.duracao_minutos ?? 0;
                  const durStr = dur > 0 ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m` : '-';

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {formatarDataBrasilia(reg.data_registro)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{reg.usuario_nome}</div>
                        <div className="text-[11px] text-blue-600 font-mono">ID #{reg.usuario_id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {reg.setor}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-700">
                        {reg.hora_entrada ? formatarHoraBrasilia(reg.hora_entrada) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-700">
                        {reg.hora_saida ? formatarHoraBrasilia(reg.hora_saida) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium text-slate-900">
                        {durStr}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {reg.hora_saida ? (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                            Concluído
                          </span>
                        ) : ehHoje ? (
                          <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                            Em andamento
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium" title="Não bateu saída no dia">
                            Sem saída
                          </span>
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
