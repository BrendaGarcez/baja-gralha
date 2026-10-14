import { useState, useEffect, type FormEvent, useCallback } from 'react';
import {
  User, Hash, Send, AlertTriangle, CheckCircle2, ShieldCheck,
  ChevronDown, Users, Clock, LogIn, LogOut,
  Flame, Fingerprint
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

  // Relógio oficial de Brasília em tempo real
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

  // Carrega lista de membros cadastrados
  const carregarMembros = useCallback(async () => {
    try {
      const lista = await biometryService.getUsuarios();
      setMembros(lista);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  }, []);

  useEffect(() => {
    carregarMembros();
  }, [carregarMembros]);

  // Consulta status de entrada/saída do membro selecionado
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

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(m.id).includes(busca)
  );

  const selecionarMembro = (m: Usuario) => {
    setColaboradorId(String(m.id));
    setNome(m.nome);
    setSelecionandoMembro(false);
    setBusca('');
    setSubmitFeedback(null);
  };

  const executarRegistroPonto = async (idParaEnviar?: string, nomeParaEnviar?: string, templateParaEnviar?: string) => {
    const idFinal = (idParaEnviar ?? colaboradorId).trim();
    const nomeFinal = (nomeParaEnviar ?? nome).trim();
    const templateFinal = templateParaEnviar ?? templateBase64;

    if (!idFinal || !nomeFinal) {
      setSubmitFeedback({
        type: 'error',
        message: 'Selecione ou informe seu nome antes de registrar o ponto.'
      });
      return;
    }
    if (!templateFinal) {
      setSubmitFeedback({
        type: 'error',
        message: 'Realize a leitura biométrica do dedo no sensor USB antes de enviar.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await biometryService.registrarPonto({
        usuario_id: idFinal,
        nome: nomeFinal,
        template_base64: templateFinal,
      });

      setSubmitFeedback({
        type: 'success',
        message: res.mensagem ?? `Ponto registrado com sucesso para ${nomeFinal}!`,
        sub: `Fuso Oficial: Brasília (GMT-3) · ${relogioBrasilia.horaSegundos}`
      });

      resetCapture();

      // Atualiza o status do membro
      const idNum = parseInt(idFinal, 10);
      if (!isNaN(idNum)) {
        const novoStatus = await biometryService.getStatusAtualMembro(idNum);
        setStatusMembro(novoStatus);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar ponto no banco.';
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
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Relógio Oficial de Brasília — Clean White & Blue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                Horário Oficial de Brasília (GMT-3)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Data de Hoje: <strong className="text-slate-800">{relogioBrasilia.dataBR}</strong> · Sincronizado para entrada e saída oficiais
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-blue-600">
            {relogioBrasilia.horaSegundos}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Leitor Biométrico */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4" /> Sensor Biométrico USB
              </div>
              <span className="text-[11px] font-mono text-slate-400">DigitalPersona 4000B</span>
            </div>

            <BiometricScanner
              state={scannerState}
              onStart={startCapture}
              onReset={resetCapture}
              hasTemplate={Boolean(templateBase64)}
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800">Serviço de Hardware Indisponível</p>
                <p className="text-rose-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Dica da Regra de Entrada e Saída — Clean */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-blue-600" /> Regra Inteligente do Ponto:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li><strong>1ª batida do dia</strong>: Registra <em>Entrada</em>.</li>
              <li><strong>2ª batida do mesmo dia</strong>: Registra <em>Saída</em> e calcula o tempo total.</li>
              <li><strong>Virada de dia</strong>: Se esqueceu a saída de ontem, ela fica em branco (null) e hoje inicia uma nova <em>Entrada</em>.</li>
            </ul>
          </div>
        </div>

        {/* Coluna Direita: Identificação e Envio */}
        <div className="lg:col-span-7">
          <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Identificação do Membro
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Selecione seu nome na lista abaixo e encoste o dedo no sensor biométrico.
              </p>
            </div>

            {/* Seletor rápido de membros cadastrados */}
            {membros.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSelecionandoMembro(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 hover:bg-blue-100/60 transition shadow-xs text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    {colaboradorId && nome
                      ? <span><strong className="text-slate-900">{nome}</strong> <span className="text-blue-600 font-mono font-medium ml-1">#{colaboradorId}</span></span>
                      : <span className="text-slate-600">Clique aqui para selecionar seu nome...</span>}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${selecionandoMembro ? 'rotate-180' : ''}`} />
                </button>

                {selecionandoMembro && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Buscar por nome ou ID..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {membrosFiltrados.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">Nenhum membro encontrado</p>
                      ) : (
                        membrosFiltrados.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selecionarMembro(m)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/60 text-left transition"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{m.nome}</p>
                              <p className="text-[11px] text-slate-500">{m.setor} · {m.cargo}</p>
                            </div>
                            <span className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              #{m.id}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status dinâmico do membro selecionado — IHC: Visibilidade de Estado */}
            {statusMembro && (
              <div className={`p-4 rounded-xl border transition-all ${
                statusMembro.proximaAcao === 'SAIDA'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : statusMembro.status === 'SEM_SAIDA_ANTERIOR'
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {statusMembro.proximaAcao === 'SAIDA' ? (
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                        <LogOut className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                        <LogIn className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        {statusMembro.proximaAcao === 'SAIDA'
                          ? 'Membro Atualmente no Galpão'
                          : statusMembro.status === 'SEM_SAIDA_ANTERIOR'
                          ? 'Aguardando Novo Ponto'
                          : 'Membro Fora do Galpão'}
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {statusMembro.proximaAcao === 'SAIDA'
                          ? `Entrada registrada às ${statusMembro.horarioEntradaFormatado} (Tempo no local: ${statusMembro.tempoDecorridoFormatado})`
                          : statusMembro.status === 'SEM_SAIDA_ANTERIOR'
                          ? 'A saída do dia anterior ficou em branco. Esta batida iniciará uma nova Entrada hoje.'
                          : 'Próxima leitura registrará sua entrada oficial de hoje.'}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider shrink-0 border ${
                    statusMembro.proximaAcao === 'SAIDA'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    Próxima: {statusMembro.proximaAcao}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" /> ID do Colaborador
                </label>
                <input
                  type="text"
                  placeholder="Ex: 101"
                  value={colaboradorId}
                  onChange={e => setColaboradorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Brenda Garcez"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Confirmação Biométrica — Clean & Produção */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
              templateBase64
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  templateBase64 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                }`}>
                  {templateBase64 ? <CheckCircle2 className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {templateBase64 ? 'Digital Capturada com Sucesso' : 'Aguardando Leitura da Digital'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {templateBase64
                      ? 'Biometria identificada e pronta para registrar o ponto'
                      : 'Posicione o dedo no leitor USB ao lado'}
                  </p>
                </div>
              </div>

              {templateBase64 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Pronto
                </span>
              )}
            </div>

            {/* Feedback com alto contraste e clareza de IHC */}
            {submitFeedback && (
              <div className={`p-4 rounded-xl text-xs border ${
                submitFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-3">
                  {submitFeedback.type === 'success'
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold text-sm">{submitFeedback.message}</p>
                    {submitFeedback.sub && (
                      <p className="text-[11px] opacity-80 mt-1 font-mono">{submitFeedback.sub}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={!templateBase64 || isSubmitting || !colaboradorId}
              className={`w-full py-3.5 px-4 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 active:scale-98 ${
                statusMembro?.proximaAcao === 'SAIDA'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              } disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting
                ? 'Registrando no Firebase...'
                : statusMembro?.proximaAcao === 'SAIDA'
                ? 'Confirmar e Registrar SAÍDA'
                : 'Confirmar e Registrar ENTRADA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
