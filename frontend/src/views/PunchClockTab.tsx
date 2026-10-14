import { useState, useEffect, type FormEvent, useCallback } from 'react';
import {
  CheckCircle2, AlertCircle, ChevronDown, Clock, LogIn, LogOut, Search, X
} from 'lucide-react';
import { BiometricScanner } from '../components/biometry/BiometricScanner';
import { useBiometryReader } from '../hooks/useBiometryReader';
import { biometryService } from '../services/biometryService';
import { getBrasiliaParts } from '../utils/brasiliaTime';
import type { Usuario, StatusMembroRetorno } from '../services/types';

export const PunchClockTab = () => {
  const [colaboradorId, setColaboradorId] = useState('');
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    sub?: string;
  } | null>(null);
  const [membros, setMembros] = useState<Usuario[]>([]);
  const [selecionandoMembro, setSelecionandoMembro] = useState(false);
  const [busca, setBusca] = useState('');

  // Status do membro no galpão hoje
  const [statusMembro, setStatusMembro] = useState<StatusMembroRetorno | null>(null);

  // Relógio oficial de Brasília
  const [relogioBrasilia, setRelogioBrasilia] = useState(getBrasiliaParts());

  useEffect(() => {
    const timer = setInterval(() => {
      setRelogioBrasilia(getBrasiliaParts());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    scannerState,
    templateBase64,
    errorMessage,
    startCapture,
    resetCapture,
  } = useBiometryReader();

  const carregarMembros = useCallback(async () => {
    try {
      const lista = await biometryService.getUsuarios();
      setMembros(lista);
    } catch (err) {
      console.error('Erro ao carregar lista de membros:', err);
    }
  }, []);

  useEffect(() => {
    carregarMembros();
  }, [carregarMembros]);

  // Consulta o status do membro selecionado
  useEffect(() => {
    const idNum = parseInt(colaboradorId.trim(), 10);
    if (!isNaN(idNum) && idNum > 0) {
      biometryService.getStatusAtualMembro(idNum)
        .then(res => setStatusMembro(res))
        .catch(() => setStatusMembro(null));
    } else {
      setStatusMembro(null);
    }
  }, [colaboradorId]);

  const membroSelecionado = membros.find(m => String(m.id) === colaboradorId.trim());

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(m.id).includes(busca) ||
    m.setor.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionarMembro = (m: Usuario) => {
    setColaboradorId(String(m.id));
    setNome(m.nome);
    setSelecionandoMembro(false);
    setBusca('');
    setSubmitFeedback(null);
  };

  const limparSelecao = () => {
    setColaboradorId('');
    setNome('');
    setStatusMembro(null);
    setSubmitFeedback(null);
  };

  const executarRegistroPonto = async () => {
    const idFinal = colaboradorId.trim();
    const nomeFinal = nome.trim();

    if (!idFinal || !nomeFinal) {
      setSubmitFeedback({
        type: 'error',
        message: 'Por favor, selecione seu nome antes de confirmar o ponto.'
      });
      return;
    }
    if (!templateBase64) {
      setSubmitFeedback({
        type: 'error',
        message: 'Por favor, posicione o dedo no leitor biométrico antes de confirmar.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await biometryService.registrarPonto({
        usuario_id: idFinal,
        nome: nomeFinal,
        template_base64: templateBase64,
      });

      setSubmitFeedback({
        type: 'success',
        message: res.mensagem ?? `Ponto registrado com sucesso para ${nomeFinal}.`,
        sub: `Horário de registro: ${relogioBrasilia.horaSegundos}`
      });

      resetCapture();

      const idNum = parseInt(idFinal, 10);
      if (!isNaN(idNum)) {
        const novoStatus = await biometryService.getStatusAtualMembro(idNum);
        setStatusMembro(novoStatus);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar ponto.';
      setSubmitFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    executarRegistroPonto();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Topo do Ponto: Identificação e Horário Oficial */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Registro de Ponto</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecione seu nome e confirme sua presença pelo leitor biométrico USB
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{relogioBrasilia.dataBR}</span>
          </div>
          <span className="text-sm font-bold font-mono text-blue-600 tracking-wider">
            {relogioBrasilia.horaSegundos}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Painel Esquerdo: Leitor Biométrico */}
        <div className="md:col-span-5 space-y-3">
          <BiometricScanner
            state={scannerState}
            onStart={startCapture}
            onReset={resetCapture}
            hasTemplate={Boolean(templateBase64)}
          />

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Serviço de hardware indisponível</p>
                  <p className="mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Regras Operacionais Discretas (IHC: Ajuda e Documentação contextual) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Como funciona o ponto:</p>
            <p>1ª batida do dia marca <strong>Entrada</strong>.</p>
            <p>2ª batida do mesmo dia marca <strong>Saída</strong> e calcula a permanência.</p>
          </div>
        </div>

        {/* Painel Direito: Formulário e Identificação (IHC: Prevenção de Erros) */}
        <div className="md:col-span-7">
          <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            {/* Seletor de Membro */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Identificação do Colaborador
              </label>

              {!membroSelecionado ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelecionandoMembro(!selecionandoMembro)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-600 hover:border-slate-400 transition"
                  >
                    <span>Clique para buscar seu nome na lista...</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {selecionandoMembro && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Buscar por nome, setor ou ID..."
                          value={busca}
                          onChange={e => setBusca(e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {membrosFiltrados.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-4">Nenhum membro encontrado</p>
                        ) : (
                          membrosFiltrados.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => selecionarMembro(m)}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left transition text-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 block">{m.nome}</span>
                                <span className="text-[11px] text-slate-500">{m.setor} · {m.cargo?.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') || 'Membro'}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">#{m.id}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Card do Membro Selecionado (IHC: Confirmação e Prevenção de Erros) */
                <div className="p-3 bg-blue-50/40 border border-blue-200/80 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {membroSelecionado.nome
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(n => n[0]?.toUpperCase())
                        .join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{membroSelecionado.nome}</p>
                      <p className="text-[11px] text-slate-500">
                        {membroSelecionado.setor} · {membroSelecionado.cargo?.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') || 'Membro'} · <span className="font-mono text-blue-700 font-medium">#{membroSelecionado.id}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={limparSelecao}
                    className="text-xs text-slate-400 hover:text-slate-700 p-1 hover:bg-white rounded transition"
                    title="Trocar membro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Status Atual do Membro Selecionado (IHC: Visibilidade de Estado) */}
            {statusMembro && membroSelecionado && (
              <div className={`p-3 rounded-lg border text-xs ${
                statusMembro.proximaAcao === 'SAIDA'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-blue-50/50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center gap-2">
                  {statusMembro.proximaAcao === 'SAIDA' ? (
                    <LogOut className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {statusMembro.proximaAcao === 'SAIDA' ? 'Entrada já registrada hoje' : 'Pronto para bater entrada'}
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {statusMembro.proximaAcao === 'SAIDA'
                        ? `Horário de entrada: ${statusMembro.horarioEntradaFormatado} (Permanência: ${statusMembro.tempoDecorridoFormatado})`
                        : 'Esta batida registrará o início das suas atividades de hoje.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status da Leitura Biométrica */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-600">Leitura biométrica:</span>
              {templateBase64 ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dedo identificado
                </span>
              ) : (
                <span className="text-slate-400">Pendente no sensor USB</span>
              )}
            </div>

            {/* Mensagem de Feedback (IHC: Diagnóstico e Recuperação de Erros) */}
            {submitFeedback && (
              <div className={`p-3 rounded-lg text-xs border ${
                submitFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-2">
                  {submitFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{submitFeedback.message}</p>
                    {submitFeedback.sub && (
                      <p className="text-[11px] opacity-80 mt-0.5 font-mono">{submitFeedback.sub}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Submissão (IHC: Prevenção de Erro e Ação Clara) */}
            <button
              type="submit"
              disabled={!templateBase64 || isSubmitting || !colaboradorId}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2 active:scale-98 ${
                statusMembro?.proximaAcao === 'SAIDA'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs shadow-blue-600/20'
              } disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                'Registrando presença...'
              ) : statusMembro?.proximaAcao === 'SAIDA' ? (
                'Confirmar Saída'
              ) : (
                'Confirmar Entrada'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
