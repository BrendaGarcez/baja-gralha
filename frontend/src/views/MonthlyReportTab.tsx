import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, ChevronLeft, ChevronRight, RefreshCw,
  Clock, Users, Calendar, TrendingUp, Loader2, FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { biometryService } from '../services/biometryService';
import type { RelatorioMensal, RegistroPonto, MembroHorasResumo, Usuario } from '../services/types';

const SETORES = ['Todos', 'Chassi & Suspensão', 'Powertrain', 'Eletrônica & Telemetria', 'Freios', 'Aerodinâmica', 'Diretoria & Gestão', 'Geral'];

function gerarCSV(relatorio: RelatorioMensal): string {
  const header = ['Data', 'Colaborador', 'ID', 'Setor', 'Hora Entrada', 'Hora Saída', 'Duração (min)', 'Duração (h:mm)'];
  const rows = relatorio.registros.map((r: RegistroPonto) => {
    const dur = r.duracao_minutos ?? 0;
    const durStr = dur > 0 ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` : '-';
    return [
      r.data_registro ? format(new Date(r.data_registro), 'dd/MM/yyyy') : '-',
      r.usuario_nome,
      r.usuario_id,
      r.setor,
      r.hora_entrada ? format(new Date(r.hora_entrada), 'HH:mm') : '-',
      r.hora_saida ? format(new Date(r.hora_saida), 'HH:mm') : '-',
      dur || '-',
      durStr,
    ];
  });
  const bom = '\uFEFF'; // BOM para UTF-8 no Excel
  return bom + [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
}

function downloadCSV(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}
const KPICard: React.FC<KPICardProps> = ({ label, value, icon, color }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-100 leading-tight">{value}</p>
    </div>
  </div>
);

export const MonthlyReportTab: React.FC = () => {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [filtroSetor, setFiltroSetor] = useState('Todos');
  const [filtroUsuario, setFiltroUsuario] = useState<number | undefined>();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioMensal | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    biometryService.getUsuarios().then(setUsuarios).catch(console.error);
  }, []);

  const fetchRelatorio = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await biometryService.getRelatorioMensal(
        mes, ano,
        filtroUsuario,
        filtroSetor !== 'Todos' ? filtroSetor : undefined
      );
      setRelatorio(data);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, [mes, ano, filtroSetor, filtroUsuario]);

  useEffect(() => { fetchRelatorio(); }, [fetchRelatorio]);

  const irParaMesAnterior = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  };
  const irParaProximoMes = () => {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  };

  const handleExportarCSV = () => {
    if (!relatorio) return;
    const csv = gerarCSV(relatorio);
    downloadCSV(csv, `baja_gralha_ponto_${relatorio.mes_nome}_${relatorio.ano}.csv`);
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            Relatório de Acesso Mensal
          </h2>
          <p className="text-slate-400 text-sm mt-1">Horas de permanência e presenças consolidadas por mês</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRelatorio}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handleExportarCSV}
            disabled={!relatorio || relatorio.total_acessos === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-900/30 transition text-sm font-semibold disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Planilha
          </button>
        </div>
      </div>

      {/* Controles de período e filtros */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={irParaMesAnterior}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-[140px]">
            <p className="font-bold text-slate-100 text-base">
              {relatorio?.mes_nome ?? format(new Date(ano, mes - 1), 'MMMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </p>
            <p className="text-xs text-slate-500">{ano}</p>
          </div>
          <button
            onClick={irParaProximoMes}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 flex-1">
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filtroSetor}
            onChange={e => setFiltroSetor(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
          >
            {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filtroUsuario ?? ''}
            onChange={e => setFiltroUsuario(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-600 flex-1 min-w-[160px]"
          >
            <option value="">Todos os membros</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando relatório...
        </div>
      )}

      {erro && !loading && (
        <div className="text-center py-10 text-rose-400 text-sm">{erro}</div>
      )}

      {!loading && !erro && relatorio && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total de Horas"
              value={relatorio.total_horas_formatado || '0m'}
              icon={<Clock className="w-5 h-5 text-cyan-400" />}
              color="bg-cyan-950/80 border border-cyan-800"
            />
            <KPICard
              label="Presenças / Acessos"
              value={String(relatorio.total_acessos)}
              icon={<Calendar className="w-5 h-5 text-violet-400" />}
              color="bg-violet-950/80 border border-violet-800"
            />
            <KPICard
              label="Membros Ativos"
              value={String(relatorio.membros_ativos_qtd)}
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              color="bg-emerald-950/80 border border-emerald-800"
            />
            <KPICard
              label="Média / Dia"
              value={relatorio.media_horas_dia_formatada || '0m'}
              icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
              color="bg-amber-950/80 border border-amber-800"
            />
          </div>

          {relatorio.total_acessos === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum registro de ponto encontrado para {relatorio.mes_nome} de {relatorio.ano}.</p>
            </div>
          ) : (
            <>
              {/* Ranking de membros */}
              {relatorio.membros_resumo.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-200">Horas por Membro</h3>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {relatorio.membros_resumo.map((m: MembroHorasResumo, i: number) => {
                      const maxMin = relatorio.membros_resumo[0]?.total_minutos ?? 1;
                      const pct = maxMin > 0 ? (m.total_minutos / maxMin) * 100 : 0;
                      return (
                        <div key={m.usuario_id} className="px-5 py-3 flex items-center gap-4">
                          <span className="text-xs text-slate-600 font-mono w-5 shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-200 truncate block">{m.nome}</span>
                                <span className="text-xs text-slate-500">{m.setor} · {m.cargo}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-bold text-cyan-400">{m.total_horas_formatado}</span>
                                <p className="text-xs text-slate-500">{m.total_dias_presente}d presente</p>
                              </div>
                            </div>
                            <div className="h-1 rounded-full bg-slate-800">
                              <div
                                className="h-1 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabela de registros detalhados */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Registros Detalhados</h3>
                  <span className="text-xs text-slate-500">{relatorio.registros.length} entradas</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-3">Data</th>
                        <th className="px-5 py-3">Colaborador</th>
                        <th className="px-5 py-3">Setor</th>
                        <th className="px-5 py-3 text-center">Entrada</th>
                        <th className="px-5 py-3 text-center">Saída</th>
                        <th className="px-5 py-3 text-center">Permanência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {relatorio.registros.map((r: RegistroPonto) => {
                        const dur = r.duracao_minutos ?? 0;
                        const durStr = dur > 0
                          ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m`
                          : '-';
                        return (
                          <tr key={r.id} className="hover:bg-slate-800/30 transition">
                            <td className="px-5 py-3 text-xs text-slate-400">
                              {r.data_registro ? format(new Date(r.data_registro), 'dd/MM/yyyy') : '-'}
                            </td>
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-200 text-sm">{r.usuario_nome}</div>
                              <div className="text-xs text-slate-500">ID #{r.usuario_id}</div>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-400">{r.setor}</td>
                            <td className="px-5 py-3 text-center font-mono text-emerald-400 text-xs">
                              {r.hora_entrada ? format(new Date(r.hora_entrada), 'HH:mm') : '-'}
                            </td>
                            <td className="px-5 py-3 text-center font-mono text-rose-400 text-xs">
                              {r.hora_saida ? format(new Date(r.hora_saida), 'HH:mm') : (
                                <span className="text-amber-500">Em atividade</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                dur > 0
                                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}>
                                {durStr}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
