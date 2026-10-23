import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
import { biometryService } from '../services/biometryService';
import type { EventoAgenda, EventoAgendaCreate, CategoriaEvento } from '../services/types';

const EVENTOS_PADRAO: EventoAgendaCreate[] = [
  {
    titulo: 'Validação Dinâmica do Protótipo & Treino de Pilotos',
    data: '2026-10-25',
    hora: '13:30',
    local: 'Pista de Testes Off-Road',
    categoria: 'treino',
    tags: ['Dinâmica', 'Powertrain', 'Pilotos'],
    descricao: 'Treino prático com cronometragem de voltas e teste da nova calibração da suspensão.',
  },
  {
    titulo: 'Reunião Geral: Alinhamento para Etapa Nacional',
    data: '2026-10-28',
    hora: '19:00',
    local: 'Oficina Central Baja Gralha',
    categoria: 'reuniao',
    tags: ['Planejamento', 'Equipe Completa'],
    descricao: 'Apresentação de metas dos subsistemas e revisão do cronograma de fabricação.',
  },
  {
    titulo: 'Inspeção Técnica de Segurança e Conformidade SAE',
    data: '2026-11-05',
    hora: '08:00',
    local: 'Box Principal do Autódromo',
    categoria: 'competicao',
    tags: ['SAE Brasil', 'Inspeção', 'Freios'],
    descricao: 'Checklist rigoroso de freios, estrutura e itens obrigatórios do regulamento SAE.',
  },
];

const FORM_INICIAL: EventoAgendaCreate = {
  titulo: '',
  data: new Date().toISOString().split('T')[0],
  hora: '14:00',
  local: 'Oficina Central Baja Gralha',
  categoria: 'treino',
  descricao: '',
  tags: [],
};

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

function formatarDataAmigavel(dataIso: string): string {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    const ano = partes[0];
    const mesNum = parseInt(partes[1], 10) - 1;
    const dia = partes[2];
    const mesNome = MESES_ABREV[mesNum] || partes[1];
    return `${dia} ${mesNome}, ${ano}`;
  }
  return dataIso;
}

export const CalendarTab = () => {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Sheet de Cadastro
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<EventoAgendaCreate>(FORM_INICIAL);
  const [tagsInput, setTagsInput] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  // Exclusão
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const carregarEventos = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await biometryService.getEventos();
      if (lista.length === 0) {
        // Se ainda não houver eventos cadastrados na nuvem, inicializa com os padrões
        for (const ev of EVENTOS_PADRAO) {
          try {
            await biometryService.createEvento(ev);
          } catch {
            // Ignora se não conseguir salvar
          }
        }
        const listaAtualizada = await biometryService.getEventos();
        setEventos(listaAtualizada.length > 0 ? listaAtualizada : (EVENTOS_PADRAO.map((p, idx) => ({ ...p, id: String(idx + 1) }))));
      } else {
        setEventos(lista);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      // Fallback visual
      setEventos(EVENTOS_PADRAO.map((p, idx) => ({ ...p, id: String(idx + 1) })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  const abrirNovo = () => {
    setForm(FORM_INICIAL);
    setTagsInput('');
    setFeedback(null);
    setSheetOpen(true);
  };

  const fecharSheet = () => {
    setSheetOpen(false);
    setFeedback(null);
  };

  const handleSalvar = async () => {
    if (!form.titulo.trim()) {
      setFeedback({ tipo: 'error', msg: 'O título do evento é obrigatório.' });
      return;
    }
    if (!form.data.trim()) {
      setFeedback({ tipo: 'error', msg: 'A data do evento é obrigatória.' });
      return;
    }
    if (!form.local.trim()) {
      setFeedback({ tipo: 'error', msg: 'O local do evento é obrigatório.' });
      return;
    }

    setSalvando(true);
    setFeedback(null);

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload: EventoAgendaCreate = {
      ...form,
      titulo: form.titulo.trim(),
      local: form.local.trim(),
      descricao: form.descricao?.trim() || '',
      tags: tagsArray,
    };

    try {
      await biometryService.createEvento(payload);
      setFeedback({ tipo: 'success', msg: 'Evento cadastrado com sucesso na nuvem!' });
      await carregarEventos();
      setTimeout(() => fecharSheet(), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar evento.';
      setFeedback({ tipo: 'error', msg });
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id: string, titulo: string) => {
    if (!window.confirm(`Deseja realmente excluir o evento "${titulo}"?`)) return;

    setDeletandoId(id);
    try {
      await biometryService.deleteEvento(id);
      await carregarEventos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir evento.');
    } finally {
      setDeletandoId(null);
    }
  };

  const eventosFiltrados = eventos.filter(ev => {
    if (filtroCategoria === 'todos') return true;
    return ev.categoria === filtroCategoria;
  });

  const getCategoriaBadge = (cat: CategoriaEvento) => {
    switch (cat) {
      case 'treino':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Treino Técnico
          </span>
        );
      case 'competicao':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Competição SAE
          </span>
        );
      case 'reuniao':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Reunião Geral
          </span>
        );
      case 'outro':
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Atividade Geral
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
            Cronograma oficial de treinos, reuniões e competições do Baja Gralha
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-semibold shadow-xs shadow-blue-600/20 active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          Cadastrar Evento
        </button>
      </div>

      {/* Filtros por Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'todos', label: 'Todos os Eventos' },
          { id: 'treino', label: 'Treinos Técnicos' },
          { id: 'reuniao', label: 'Reuniões' },
          { id: 'competicao', label: 'Competições SAE' },
          { id: 'outro', label: 'Outras Atividades' },
        ].map(cat => {
          const isActive = filtroCategoria === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Agenda */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Carregando eventos da nuvem...
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Nenhum evento agendado nesta categoria</p>
          <p className="text-xs text-slate-400 mt-1">Clique no botão abaixo para adicionar uma nova atividade à agenda.</p>
          <button
            onClick={abrirNovo}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventosFiltrados.map((ev) => (
            <div
              key={ev.id}
              className="bg-white border border-slate-200 hover:border-blue-300 p-4 rounded-xl shadow-2xs flex flex-col justify-between space-y-3 transition group"
            >
              <div className="space-y-2.5">
                {/* Cabeçalho do Card: Data e Categoria */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-blue-600 font-semibold bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> {formatarDataAmigavel(ev.data)}
                  </span>
                  {getCategoriaBadge(ev.categoria)}
                </div>

                {/* Título do Evento */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {ev.titulo}
                </h3>

                {/* Descrição se houver */}
                {ev.descricao && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {ev.descricao}
                  </p>
                )}

                {/* Tags */}
                {ev.tags && ev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ev.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé do Card: Hora, Local e Ações */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{ev.hora}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{ev.local}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletar(ev.id, ev.titulo)}
                  disabled={deletandoId === ev.id}
                  title="Excluir evento"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  {deletandoId === ev.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet Lateral para Cadastro de Novo Evento */}
      <Sheet
        open={sheetOpen}
        onClose={fecharSheet}
        title="Cadastrar Novo Evento"
        subtitle="Adicione uma nova atividade oficial ao cronograma da equipe"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={fecharSheet}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs shadow-blue-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {salvando ? 'Salvando na Nuvem...' : 'Salvar Evento'}
            </button>
          </div>
        }
      >
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border mb-4 ${
              feedback.tipo === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.tipo === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Atividade <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Treino de Suspensão e Frenagem"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoria do Evento
            </label>
            <select
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaEvento }))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="treino">Treino Técnico</option>
              <option value="reuniao">Reunião Geral</option>
              <option value="competicao">Competição SAE</option>
              <option value="outro">Outra Atividade</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Local do Evento <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Oficina Central, Pista de Testes, Box SAE"
              value={form.local}
              onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Observações <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Descreva detalhes, objetivos ou materiais necessários para a atividade..."
              value={form.descricao || ''}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags / Marcadores <span className="text-slate-400 font-normal">(separados por vírgula)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Freios, Pilotos, Powertrain, SAE"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>
      </Sheet>
    </div>
  );
};
