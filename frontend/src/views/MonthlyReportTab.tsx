import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, ChevronLeft, ChevronRight, RefreshCw,
  Clock, Users, Calendar, TrendingUp, Loader2, FileSpreadsheet,
  Building2, Award
} from 'lucide-react';
import { biometryService } from '../services/biometryService';
import { formatarDataBrasilia, formatarHoraBrasilia, isHojeEmBrasilia } from '../utils/brasiliaTime';
import type { RelatorioMensal, RegistroPonto, MembroHorasResumo, SetorPresencaResumo, Usuario } from '../services/types';

const SETORES = ['Todos', 'Chassi & Suspensão', 'Powertrain', 'Eletrônica & Telemetria', 'Freios', 'Aerodinâmica', 'Diretoria & Gestão', 'Geral'];

function gerarCSVRegistros(relatorio: RelatorioMensal): string {
  const header = ['Data (Brasília)', 'Colaborador', 'ID', 'Setor', 'Hora Entrada (Brasília)', 'Hora Saída (Brasília)', 'Duração (min)', 'Duração (h:mm)'];
  const rows = relatorio.registros.map((r: RegistroPonto) => {
    const dur = r.duracao_minutos ?? 0;
    const durStr = dur > 0 ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` : '-';
    return [
      formatarDataBrasilia(r.data_registro),
      r.usuario_nome,
      r.usuario_id,
      r.setor,
      r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-',
      r.hora_saida ? formatarHoraBrasilia(r.hora_saida) : 'Sem Saída',
      dur || '-',
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
    'Membros Presentes no Mês',
    'Total de Presenças (Batidas)',
    'Total de Horas',
    'Total em Minutos',
    'Média de Horas por Membro Presente',
    'Percentual do Total (%)'
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

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}
const KPICard: React.FC<KPICardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-500 font-semibold">{label}</p>
      <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">{value}</p>
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

  // Aba selecionada: SETORES | MEMBROS | REGISTROS
  const [visaoRelatorio, setVisaoRelatorio] = useState<'SETORES' | 'MEMBROS' | 'REGISTROS'>('SETORES');

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

  const handleExportarRegistros = () => {
    if (!relatorio) return;
    const csv = gerarCSVRegistros(relatorio);
    downloadCSV(csv, `baja_gralha_pontos_${relatorio.mes_nome}_${relatorio.ano}.csv`);
  };

  const handleExportarSetores = () => {
    if (!relatorio) return;
    const csv = gerarCSVSetores(relatorio);
    downloadCSV(csv, `baja_gralha_relatorio_setores_${relatorio.mes_nome}_${relatorio.ano}.csv`);
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Cabeçalho Clean & Blue */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Relatório de Presenças & Setores
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Consolidação de horas e frequência calculadas no Horário Oficial de Brasília
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={fetchRelatorio}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-300 transition text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleExportarSetores}
            disabled={!relatorio || relatorio.total_acessos === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20 transition text-xs font-bold disabled:opacity-40"
          >
            <Building2 className="w-4 h-4" />
            Planilha por Setor
          </button>

          <button
            onClick={handleExportarRegistros}
            disabled={!relatorio || relatorio.total_acessos === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/20 transition text-xs font-bold disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Planilha de Pontos
          </button>
        </div>
      </div>

      {/* Controles de período e filtros — Clean */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center shadow-xs">
        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={irParaMesAnterior}
            className="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-[140px]">
            <p className="font-extrabold text-slate-900 text-base">
              {relatorio?.mes_nome ?? `Mês ${mes}`}
            </p>
            <p className="text-xs text-slate-400 font-mono font-medium">{ano}</p>
          </div>
          <button
            onClick={irParaProximoMes}
            className="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 flex-1 w-full sm:w-auto">
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-mono shadow-xs"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filtroSetor}
            onChange={e => setFiltroSetor(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filtroUsuario ?? ''}
            onChange={e => setFiltroUsuario(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 flex-1 min-w-[160px] shadow-xs"
          >
            <option value="">Todos os membros</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.setor})</option>)}
          </select>
        </div>
      </div>

      {/* Seletor de Visão do Relatório — Segmented Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setVisaoRelatorio('SETORES')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            visaoRelatorio === 'SETORES'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Presenças por Setor
        </button>

        <button
          onClick={() => setVisaoRelatorio('MEMBROS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            visaoRelatorio === 'MEMBROS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Horas por Membro
        </button>

        <button
          onClick={() => setVisaoRelatorio('REGISTROS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            visaoRelatorio === 'REGISTROS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Registros Detalhados ({relatorio?.registros.length ?? 0})
        </button>
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> Carregando relatório...
        </div>
      )}

      {erro && !loading && (
        <div className="text-center py-10 text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded-2xl p-4">
          {erro}
        </div>
      )}

      {!loading && !erro && relatorio && (
        <>
          {/* KPIs Gerais Clean */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total de Horas no Mês"
              value={relatorio.total_horas_formatado || '0m'}
              icon={<Clock className="w-6 h-6 text-blue-600" />}
              color="bg-blue-50 border border-blue-200"
            />
            <KPICard
              label="Presenças Registradas"
              value={String(relatorio.total_acessos)}
              icon={<Calendar className="w-6 h-6 text-indigo-600" />}
              color="bg-indigo-50 border border-indigo-200"
            />
            <KPICard
              label="Membros Ativos"
              value={String(relatorio.membros_ativos_qtd)}
              icon={<Users className="w-6 h-6 text-emerald-600" />}
              color="bg-emerald-50 border border-emerald-200"
            />
            <KPICard
              label="Média de Horas / Dia"
              value={relatorio.media_horas_dia_formatada || '0m'}
              icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
              color="bg-amber-50 border border-amber-200"
            />
          </div>

          {relatorio.total_acessos === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-bold text-slate-700">Nenhum registro de ponto encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Não há presenças registradas para {relatorio.mes_nome} de {relatorio.ano} no fuso de Brasília.
              </p>
            </div>
          ) : (
            <>
              {/* VISÃO 1: RELATÓRIO CONSOLIDADO POR SETOR — Clean White & Blue */}
              {visaoRelatorio === 'SETORES' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          Consolidação das Presenças por Setor ({relatorio.mes_nome}/{relatorio.ano})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Comparativo de frequência e horas de dedicação entre os subsistemas da equipe
                        </p>
                      </div>
                      <button
                        onClick={handleExportarSetores}
                        className="text-xs font-semibold px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Baixar Tabela de Setores (.csv)
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-3.5">Setor</th>
                            <th className="px-5 py-3.5 text-center">Membros Cadastrados</th>
                            <th className="px-5 py-3.5 text-center">Membros Presentes</th>
                            <th className="px-5 py-3.5 text-center">Presenças (Pontos)</th>
                            <th className="px-5 py-3.5 text-center">Total de Horas</th>
                            <th className="px-5 py-3.5 text-center">Média / Membro</th>
                            <th className="px-5 py-3.5">Participação no Baja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {relatorio.setores_resumo.map((s: SetorPresencaResumo, i: number) => {
                            const isLider = i === 0 && s.total_minutos > 0;
                            return (
                              <tr key={s.setor} className="hover:bg-blue-50/30 transition">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    {isLider && (
                                      <span title="Setor com mais horas no mês">
                                        <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                      </span>
                                    )}
                                    <div>
                                      <span className="font-bold text-slate-900 block">{s.setor}</span>
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        {s.total_membros_presentes > 0
                                          ? `${s.total_membros_presentes} membros ativos`
                                          : 'Nenhum membro ativo'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-600">
                                  {s.total_membros_cadastrados}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                    s.total_membros_presentes > 0
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'text-slate-400'
                                  }`}>
                                    {s.total_membros_presentes}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-center font-mono text-xs font-semibold text-slate-800">
                                  {s.total_presencas}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="font-bold text-blue-700 font-mono text-sm">
                                    {s.total_horas_formatado}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-600">
                                  {s.media_horas_por_membro_formatada}
                                </td>
                                <td className="px-5 py-3.5 min-w-[160px]">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                                        style={{ width: `${s.percentual_horas}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                                      {s.percentual_horas}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VISÃO 2: HORAS POR MEMBRO — Clean White & Blue */}
              {visaoRelatorio === 'MEMBROS' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" /> Ranking Individual de Horas
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {relatorio.membros_resumo.map((m: MembroHorasResumo, i: number) => {
                      const maxMin = relatorio.membros_resumo[0]?.total_minutos ?? 1;
                      const pct = maxMin > 0 ? (m.total_minutos / maxMin) * 100 : 0;
                      return (
                        <div key={m.usuario_id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition">
                          <span className={`text-xs font-mono font-bold w-6 shrink-0 ${
                            i === 0 ? 'text-amber-500 text-sm' : i === 1 ? 'text-slate-600' : i === 2 ? 'text-amber-700' : 'text-slate-400'
                          }`}>
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-slate-900 truncate block">{m.nome}</span>
                                <span className="text-xs text-slate-500">{m.setor} · {m.cargo}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-bold text-blue-700 font-mono">{m.total_horas_formatado}</span>
                                <p className="text-[11px] text-slate-500 font-mono">{m.total_dias_presente} dia(s) presente</p>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
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

              {/* VISÃO 3: REGISTROS DETALHADOS — Clean White & Blue */}
              {visaoRelatorio === 'REGISTROS' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Histórico de Batidas de Ponto</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Todos os horários calculados no Horário Oficial de Brasília (GMT-3)</p>
                    </div>
                    <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {relatorio.registros.length} batidas no mês
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Data (Brasília)</th>
                          <th className="px-5 py-3.5">Colaborador</th>
                          <th className="px-5 py-3.5">Setor</th>
                          <th className="px-5 py-3.5 text-center">Entrada</th>
                          <th className="px-5 py-3.5 text-center">Saída</th>
                          <th className="px-5 py-3.5 text-center">Permanência</th>
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
                            <tr key={r.id} className="hover:bg-blue-50/30 transition">
                              <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                                {formatarDataBrasilia(r.data_registro)}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900 text-sm">{r.usuario_nome}</div>
                                <div className="text-[11px] text-slate-400 font-mono">#{r.usuario_id}</div>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                  {r.setor}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-center font-mono text-emerald-700 text-xs font-bold">
                                {r.hora_entrada ? formatarHoraBrasilia(r.hora_entrada) : '-'}
                              </td>
                              <td className="px-5 py-3.5 text-center font-mono text-xs">
                                {r.hora_saida ? (
                                  <span className="text-rose-700 font-bold">{formatarHoraBrasilia(r.hora_saida)}</span>
                                ) : ehHoje ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                                    🟢 No Galpão
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold" title="Esqueceu de bater saída no dia">
                                    ⚠️ Sem Saída
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono ${
                                  dur > 0
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
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
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
