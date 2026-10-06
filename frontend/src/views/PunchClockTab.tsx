import { useState, useEffect, type FormEvent } from 'react';
import { User, Hash, Send, AlertTriangle, CheckCircle2, ShieldCheck, Database, ChevronDown, Users } from 'lucide-react';
import { BiometricScanner } from '../components/biometry/BiometricScanner';
import { useBiometryReader } from '../hooks/useBiometryReader';
import { biometryService } from '../services/biometryService';
import type { Usuario } from '../services/types';

export const PunchClockTab = () => {
  const [colaboradorId, setColaboradorId] = useState('');
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [membros, setMembros] = useState<Usuario[]>([]);
  const [selecionandoMembro, setSelecionandoMembro] = useState(false);
  const [busca, setBusca] = useState('');

  const {
    scannerState,
    templateBase64,
    errorMessage,
    startCapture,
    resetCapture,
  } = useBiometryReader();

  // Carrega lista de membros cadastrados
  useEffect(() => {
    biometryService.getUsuarios().then(setMembros).catch(console.error);
  }, []);

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(m.id).includes(busca)
  );

  const selecionarMembro = (m: Usuario) => {
    setColaboradorId(String(m.id));
    setNome(m.nome);
    setSelecionandoMembro(false);
    setBusca('');
  };

  const handleRegistrarPonto = async (e: FormEvent) => {
    e.preventDefault();
    if (!colaboradorId.trim() || !nome.trim()) {
      setSubmitFeedback({ type: 'error', message: 'Preencha o ID e o Nome antes de registrar o ponto.' });
      return;
    }
    if (!templateBase64) {
      setSubmitFeedback({ type: 'error', message: 'Realize a leitura biométrica do dedo antes de enviar.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await biometryService.registrarPonto({
        usuario_id: colaboradorId.trim(),
        nome: nome.trim(),
        template_base64: templateBase64,
      });

      setSubmitFeedback({
        type: 'success',
        message: res.mensagem ?? `Ponto registrado com sucesso para ${nome.trim()}!`,
      });

      resetCapture();
      setColaboradorId('');
      setNome('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com a API central FastAPI (porta 8083).';
      setSubmitFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
      {/* Coluna Esquerda: Leitor Biométrico */}
      <div className="lg:col-span-5 space-y-4">
        <div className="border border-slate-800/80 bg-slate-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" /> Sensor Biométrico
            </div>
            <span className="text-[11px] font-mono text-slate-500">DigitalPersona 4000B</span>
          </div>

          <BiometricScanner
            state={scannerState}
            onStart={startCapture}
            onReset={resetCapture}
            hasTemplate={Boolean(templateBase64)}
          />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Serviço de Hardware Indisponível</p>
              <p className="text-slate-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Coluna Direita: Identificação e Envio */}
      <div className="lg:col-span-7">
        <form onSubmit={handleRegistrarPonto} className="border border-slate-800/80 bg-slate-900/40 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" /> Identificação do Membro
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Informe ou selecione suas credenciais da equipe Baja Gralha.
            </p>
          </div>

          {/* Seletor rápido de membros cadastrados */}
          {membros.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelecionandoMembro(prev => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-950/70 transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  {colaboradorId && nome
                    ? `${nome} (ID #${colaboradorId})`
                    : 'Selecionar membro cadastrado'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selecionandoMembro ? 'rotate-180' : ''}`} />
              </button>

              {selecionandoMembro && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-slate-800">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar por nome ou ID..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {membrosFiltrados.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-4">Nenhum membro encontrado</p>
                    ) : (
                      membrosFiltrados.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selecionarMembro(m)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800 text-left transition"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-200">{m.nome}</p>
                            <p className="text-xs text-slate-500">{m.setor} · {m.cargo}</p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">#{m.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" /> ID do Colaborador
              </label>
              <input
                type="text"
                placeholder="Ex: 101"
                value={colaboradorId}
                onChange={e => setColaboradorId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Nome Completo
              </label>
              <input
                type="text"
                placeholder="Ex: Brenda Garcez"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          {/* Template Base64 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" /> Template Biométrico (Minúcias Base64)
              </label>
              {templateBase64 ? (
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Digital Capturada
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Aguardando leitura...</span>
              )}
            </div>
            <textarea
              readOnly
              rows={3}
              value={templateBase64 || ''}
              placeholder="As minúcias em Base64 extraídas pelo SDK DigitalPersona aparecerão aqui..."
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 resize-none select-all focus:outline-none"
            />
          </div>

          {/* Feedback */}
          {submitFeedback && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-lg text-xs border ${
              submitFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
            }`}>
              {submitFeedback.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <span>{submitFeedback.message}</span>
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={!templateBase64 || isSubmitting}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Registrando Presença na API...' : 'Confirmar e Registrar Ponto'}
          </button>
        </form>
      </div>
    </div>
  );
};
