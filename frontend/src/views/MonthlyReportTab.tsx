import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, RefreshCw,
  Clock, Users, Calendar, TrendingUp, Loader2, Download,
  ArrowLeft, CheckCircle2, AlertCircle, Fingerprint,
  ChevronDown
} from 'lucide-react';
import { biometryService } from '../services/biometryService';
import { formatarDataBrasilia, formatarHoraBrasilia, isHojeEmBrasilia, getBrasiliaParts } from '../utils/brasiliaTime';
import type { RelatorioMensal, RegistroPonto, MembroHorasResumo, SetorPresencaResumo, Usuario } from '../services/types';

const SETORES = ['Todos', 'Gestão', 'Projetos', 'Marketing', 'Manufatura', 'Tríplice', 'Trainee'];

function formatarDataComSemana(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';
  const d = new Date(dataISO);
  if (isNaN(d.getTime())) return '-';
  const bParts = getBrasiliaParts(d);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diaSemana = diasSemana[d.getDay()];
  return `${bParts.dataBR} (${diaSemana})`;
}

function gerarCSVRegistros(relatorio: RelatorioMensal): string {
  const header = ['Data', 'Colaborador', 'ID', 'Setor', 'Entrada', 'Saída', 'Minutos', 'Carga Horária'];
  const rows = relatorio.registros.map((r: RegistroPonto) => {
    const dur = r.duracao_minutos ?? 0;
    const durStr = dur > 0 ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m` : '-';
    return [
      formatarDataBrasilia(r.data_registro),
      r.usuario_nome,
      r.usuario_id,
      r.setor,
      r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-',
      r.hora_saida ? formatarHoraBrasilia(r.hora_saida) : 'Pendente',
      dur || 0,
      durStr,
    ];
  });
  const bom = '\uFEFF';
  return bom + [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
}

function gerarCSVSetores(relatorio: RelatorioMensal): string {
  const header = [
    'Setor',
    'Membros Cadastrados',
    'Membros Presentes',
    'Total de Presenças',
    'Total de Horas',
    'Minutos Totais',
    'Média por Membro',
    'Participação (%)'
  ];
  const rows = (relatorio.setores_resumo || []).map((s: SetorPresencaResumo) => [
    s.setor,
    s.total_membros_cadastrados,
    s.total_membros_presentes,
    s.total_presencas,
    s.total_horas_formatado,
    s.total_minutos,
    s.media_horas_por_membro_formatada,
    `${s.percentual_horas}%`
  ]);
  const bom = '\uFEFF';
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

interface StatProps {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
}
const MetricStat: React.FC<StatProps> = ({ label, value, helper, icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
    <div className="flex items-center justify-between text-slate-500 mb-2">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      {icon && <span className="text-slate-400">{icon}</span>}
    </div>
    <div>
      <p className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</p>
      {helper && <p className="text-xs text-slate-400 mt-0.5">{helper}</p>}
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
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);

  // Visão quando nenhum membro específico está selecionado
  const [visao, setVisao] = useState<'MEMBROS' | 'SETORES' | 'REGISTROS'>('MEMBROS');

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
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados do relatório.');
    } finally {
      setLoading(false);
    }
  }, [mes, ano, filtroSetor, filtroUsuario]);

  useEffect(() => {
    fetchRelatorio();
  }, [fetchRelatorio]);

  const irParaMesAnterior = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  };
  const irParaProximoMes = () => {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  };

  // Dados do membro selecionado (se houver)
  const membroSelecionado = useMemo(() => {
    if (!filtroUsuario) return null;
    return usuarios.find(u => u.id === filtroUsuario) || null;
  }, [usuarios, filtroUsuario]);

  // Estatísticas específicas do membro selecionado no período
  const metricasMembro = useMemo(() => {
    if (!filtroUsuario || !relatorio) return null;
    const registrosMembro = relatorio.registros.filter(r => r.usuario_id === filtroUsuario);

    const totalMinutos = registrosMembro.reduce((acc, r) => acc + (r.duracao_minutos || 0), 0);
    const diasUnicos = new Set(registrosMembro.map(r => r.data_registro ? r.data_registro.split('T')[0] : ''));
    diasUnicos.delete('');

    const completos = registrosMembro.filter(r => r.hora_entrada && r.hora_saida).length;
    const pendentes = registrosMembro.filter(r => !r.hora_saida).length;

    const horasFormatadas = `${Math.floor(totalMinutos / 60)}h ${String(totalMinutos % 60).padStart(2, '0')}m`;
    const mediaPorDiaMin = diasUnicos.size > 0 ? Math.floor(totalMinutos / diasUnicos.size) : 0;
    const mediaFormatada = `${Math.floor(mediaPorDiaMin / 60)}h ${String(mediaPorDiaMin % 60).padStart(2, '0')}m`;

    return {
      registros: registrosMembro,
      totalPresencas: registrosMembro.length,
      diasAtivos: diasUnicos.size,
      totalMinutos,
      horasFormatadas,
      mediaFormatada,
      completos,
      pendentes,
    };
  }, [filtroUsuario, relatorio]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Topo Limpo e Funcional */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Relatório Mensal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de horas trabalhadas e controle de presença da equipe
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchRelatorio}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 transition text-xs font-medium shadow-2xs"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-600' : ''}`} />
            Atualizar
          </button>

          {/* Dropdown de Exportação */}
          <div className="relative">
            <button
              onClick={() => setMenuExportarAberto(!menuExportarAberto)}
              disabled={!relatorio || relatorio.total_acessos === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-medium shadow-xs shadow-blue-600/20 active:scale-98 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Planilha
              <ChevronDown className="w-3 h-3 text-white/80" />
            </button>

            {menuExportarAberto && relatorio && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs"
                onMouseLeave={() => setMenuExportarAberto(false)}
              >
                <button
                  onClick={() => {
                    const csv = gerarCSVRegistros(relatorio);
                    downloadCSV(csv, `relatorio_pontos_${relatorio.mes_nome}_${relatorio.ano}.csv`);
                    setMenuExportarAberto(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Batidas de Ponto</span>
                  <span className="text-[10px] text-slate-400 font-mono">CSV</span>
                </button>
                <button
                  onClick={() => {
                    const csv = gerarCSVSetores(relatorio);
                    downloadCSV(csv, `relatorio_setores_${relatorio.mes_nome}_${relatorio.ano}.csv`);
                    setMenuExportarAberto(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between border-t border-slate-100"
                >
                  <span>Resumo por Setor</span>
                  <span className="text-[10px] text-slate-400 font-mono">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Período */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-2xs">
        {/* Navegador de Mês */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={irParaMesAnterior}
            className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-2xs"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center px-2 min-w-[130px]">
            <span className="font-semibold text-slate-900 text-sm block">
              {relatorio?.mes_nome ?? `Mês ${mes}`}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{ano}</span>
          </div>
          <button
            onClick={irParaProximoMes}
            className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-2xs"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros de Setor e Membro */}
        <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
          <select
            value={filtroSetor}
            onChange={e => setFiltroSetor(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-slate-500 shadow-2xs"
          >
            {SETORES.map(s => (
              <option key={s} value={s}>{s === 'Todos' ? 'Todos os setores' : s}</option>
            ))}
          </select>

          <select
            value={filtroUsuario ?? ''}
            onChange={e => setFiltroUsuario(e.target.value ? Number(e.target.value) : undefined)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-slate-500 shadow-2xs min-w-[190px]"
          >
            <option value="">Equipe inteira (Todos os membros)</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.cargo ? u.cargo.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') : u.setor})
              </option>
            ))}
          </select>

          {filtroUsuario && (
            <button
              onClick={() => setFiltroUsuario(undefined)}
              className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Voltar para a visão geral"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Feedback de Carregamento e Erro */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-600" />
          <span className="text-xs">Carregando dados...</span>
        </div>
      )}

      {erro && !loading && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3.5">
          {erro}
        </div>
      )}

      {!loading && !erro && relatorio && (
        <>
          {/* ========================================================= */}
          {/* CASO 1: MEMBRO ESPECÍFICO SELECIONADO (DETALHE COMPLETO) */}
          {/* ========================================================= */}
          {filtroUsuario !== undefined && membroSelecionado ? (
            <div className="space-y-4">
              {/* Botão de Retorno */}
              <button
                onClick={() => setFiltroUsuario(undefined)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para visão da equipe
              </button>

              {/* Ficha / Detalhe do Membro */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shadow-blue-600/20">
                      {membroSelecionado.nome
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(n => n[0]?.toUpperCase())
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{membroSelecionado.nome}</h2>
                        <span className="text-xs text-blue-700 font-mono font-medium">#{membroSelecionado.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {membroSelecionado.setor} · <span className="text-slate-700 font-medium">{membroSelecionado.cargo?.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') || 'Membro'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                      membroSelecionado.tem_biometria
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <Fingerprint className="w-3 h-3" />
                      {membroSelecionado.tem_biometria ? 'Digital Cadastrada' : 'Sem Biometria'}
                    </span>
                  </div>
                </div>

                {/* Métricas Individuais do Mês */}
                {metricasMembro && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                    <div className="p-3 rounded-lg bg-blue-50/30 border border-blue-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total de Horas</span>
                      <span className="text-xl font-bold text-blue-600 mt-1 block">{metricasMembro.horasFormatadas}</span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{metricasMembro.totalMinutos} minutos</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Dias Presente</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">{metricasMembro.diasAtivos}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{metricasMembro.totalPresencas} batidas registradas</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Média por Dia</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">{metricasMembro.mediaFormatada}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">por dia trabalhado</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Conformidade</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {metricasMembro.totalPresencas > 0
                          ? `${Math.round((metricasMembro.completos / metricasMembro.totalPresencas) * 100)}%`
                          : '100%'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {metricasMembro.pendentes > 0 ? `${metricasMembro.pendentes} sem saída` : 'Todas saídas batidas'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela Cronológica de Presenças do Membro */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Histórico de Presenças no Mês ({relatorio.mes_nome}/{relatorio.ano})
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {metricasMembro?.registros.length || 0} registros
                  </span>
                </div>

                {metricasMembro && metricasMembro.registros.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Data</th>
                          <th className="px-4 py-2.5 text-center">Entrada</th>
                          <th className="px-4 py-2.5 text-center">Saída</th>
                          <th className="px-4 py-2.5 text-center">Permanência</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metricasMembro.registros.map(r => {
                          const dur = r.duracao_minutos ?? 0;
                          const durStr = dur > 0
                            ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m`
                            : '-';
                          const ehHoje = isHojeEmBrasilia(r.data_registro);

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                {formatarDataComSemana(r.data_registro)}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">
                                {r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">
                                {r.hora_saida ? formatarHoraBrasilia(r.hora_saida) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-medium text-slate-900">
                                {durStr}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {r.hora_saida ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> Concluído
                                  </span>
                                ) : ehHoje ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                                    Em andamento
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium" title="Não bateu saída ao final do dia">
                                    <AlertCircle className="w-3 h-3" /> Sem saída
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhum registro de ponto encontrado para este membro no período selecionado.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* CASO 2: VISÃO GERAL DA EQUIPE                            */
            /* ========================================================= */
            <div className="space-y-4">
              {/* KPIs Consolidados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricStat
                  label="Total de Horas"
                  value={relatorio.total_horas_formatado || '0h 00m'}
                  helper={`${relatorio.total_horas_trabalhadas_minutos} min acumulados`}
                  icon={<Clock className="w-4 h-4" />}
                />
                <MetricStat
                  label="Presenças"
                  value={String(relatorio.total_acessos)}
                  helper="Batidas registradas"
                  icon={<Calendar className="w-4 h-4" />}
                />
                <MetricStat
                  label="Membros Ativos"
                  value={String(relatorio.membros_ativos_qtd)}
                  helper={`de ${usuarios.length} cadastrados`}
                  icon={<Users className="w-4 h-4" />}
                />
                <MetricStat
                  label="Média Diária"
                  value={relatorio.media_horas_dia_formatada || '0h 00m'}
                  helper="por dia de oficina"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </div>

              {/* Seletor de Visão */}
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  onClick={() => setVisao('MEMBROS')}
                  className={`px-4 py-2.5 font-medium border-b-2 transition ${
                    visao === 'MEMBROS'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Membros ({relatorio.membros_resumo.length})
                </button>
                <button
                  onClick={() => setVisao('SETORES')}
                  className={`px-4 py-2.5 font-medium border-b-2 transition ${
                    visao === 'SETORES'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Setores ({relatorio.setores_resumo.length})
                </button>
                <button
                  onClick={() => setVisao('REGISTROS')}
                  className={`px-4 py-2.5 font-medium border-b-2 transition ${
                    visao === 'REGISTROS'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos os Registros ({relatorio.registros.length})
                </button>
              </div>

              {/* VISÃO: MEMBROS */}
              {visao === 'MEMBROS' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Membro</th>
                          <th className="px-4 py-2.5">Setor & Cargo</th>
                          <th className="px-4 py-2.5 text-center">Dias Presente</th>
                          <th className="px-4 py-2.5 text-center">Total de Horas</th>
                          <th className="px-4 py-2.5 text-center">Média / Dia</th>
                          <th className="px-4 py-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relatorio.membros_resumo.map((m: MembroHorasResumo) => {
                          const mediaMin = m.total_dias_presente > 0 ? Math.floor(m.total_minutos / m.total_dias_presente) : 0;
                          const mediaStr = `${Math.floor(mediaMin / 60)}h ${String(mediaMin % 60).padStart(2, '0')}m`;

                          return (
                            <tr key={m.usuario_id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900 text-xs">{m.nome}</div>
                                <div className="text-[11px] text-blue-600 font-mono">ID #{m.usuario_id}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-800">{m.setor}</div>
                                <div className="text-[11px] text-slate-400">{m.cargo?.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') || 'Membro'}</div>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">
                                {m.total_dias_presente}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-semibold text-blue-600">
                                {m.total_horas_formatado}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-500">
                                {mediaStr}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setFiltroUsuario(m.usuario_id)}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-50/60 transition"
                                >
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {relatorio.membros_resumo.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                              Nenhuma presença registrada para este filtro.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VISÃO: SETORES */}
              {visao === 'SETORES' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Setor</th>
                          <th className="px-4 py-2.5 text-center">Cadastrados</th>
                          <th className="px-4 py-2.5 text-center">Presentes</th>
                          <th className="px-4 py-2.5 text-center">Presenças</th>
                          <th className="px-4 py-2.5 text-center">Horas Totais</th>
                          <th className="px-4 py-2.5 text-center">Média / Membro</th>
                          <th className="px-4 py-2.5 min-w-[120px]">Participação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relatorio.setores_resumo.map((s: SetorPresencaResumo) => (
                          <tr key={s.setor} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {s.setor}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-600">
                              {s.total_membros_cadastrados}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-800">
                              {s.total_membros_presentes}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-600">
                              {s.total_presencas}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-blue-600">
                              {s.total_horas_formatado}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-500">
                              {s.media_horas_por_membro_formatada}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${s.percentual_horas}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-slate-600 w-8 text-right">
                                  {s.percentual_horas}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VISÃO: REGISTROS COMPLETOS */}
              {visao === 'REGISTROS' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Data</th>
                          <th className="px-4 py-2.5">Membro</th>
                          <th className="px-4 py-2.5">Setor</th>
                          <th className="px-4 py-2.5 text-center">Entrada</th>
                          <th className="px-4 py-2.5 text-center">Saída</th>
                          <th className="px-4 py-2.5 text-center">Permanência</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relatorio.registros.map((r: RegistroPonto) => {
                          const dur = r.duracao_minutos ?? 0;
                          const durStr = dur > 0
                            ? `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, '0')}m`
                            : '-';
                          const ehHoje = isHojeEmBrasilia(r.data_registro);

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3 font-mono text-slate-700">
                                {formatarDataBrasilia(r.data_registro)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{r.usuario_nome}</div>
                                <div className="text-[10px] text-slate-400 font-mono">#{r.usuario_id}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {r.setor}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">
                                {r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-700">
                                {r.hora_saida ? formatarHoraBrasilia(r.hora_saida) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-medium text-slate-900">
                                {durStr}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {r.hora_saida ? (
                                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                    Concluído
                                  </span>
                                ) : ehHoje ? (
                                  <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                                    Em andamento
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                    Sem saída
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
