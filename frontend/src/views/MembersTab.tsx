import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Trash2, Edit2, Fingerprint, ShieldCheck,
  ShieldOff, AlertTriangle, Loader2, CheckCircle2
} from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
import { BiometricScanner } from '../components/biometry/BiometricScanner';
import { biometryService } from '../services/biometryService';
import { useBiometryReader } from '../hooks/useBiometryReader';
import type { Usuario, UsuarioCreate, UsuarioUpdate } from '../services/types';

const SETORES = ['Chassi & Suspensão', 'Powertrain', 'Eletrônica & Telemetria', 'Freios', 'Aerodinâmica', 'Diretoria & Gestão', 'Geral'];
const CARGOS = ['Capitão', 'Diretor', 'Membro Efetivo', 'Trainee / Estagiário', 'Membro'];

interface FormState {
  id: string;
  nome: string;
  setor: string;
  cargo: string;
}

const FORM_INICIAL: FormState = {
  id: '', nome: '', setor: 'Geral', cargo: 'Membro',
};

export const MembersTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('Todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [deletando, setDeletando] = useState(false);

  const { scannerState, templateBase64, startCapture, resetCapture } = useBiometryReader();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await biometryService.getUsuarios();
      setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setFeedback(null);
    setSheetOpen(true);
    // Inicia captura biométrica imediatamente
    startCapture();
  };

  const abrirEdicao = (u: Usuario) => {
    setEditando(u);
    setForm({ id: String(u.id), nome: u.nome, setor: u.setor, cargo: u.cargo });
    setFeedback(null);
    setSheetOpen(true);
    // Inicia captura biométrica para permitir recadastro
    startCapture();
  };

  const fecharSheet = () => {
    setSheetOpen(false);
    resetCapture();
    setFeedback(null);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setFeedback({ tipo: 'error', msg: 'Nome é obrigatório.' });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      if (editando) {
        const payload: UsuarioUpdate = {
          nome: form.nome.trim(),
          setor: form.setor,
          cargo: form.cargo,
        };
        if (templateBase64) {
          payload.template_base64 = templateBase64;
        }
        await biometryService.updateUsuario(editando.id, payload);
        setFeedback({ tipo: 'success', msg: 'Membro atualizado com sucesso!' });
      } else {
        const payload: UsuarioCreate = {
          nome: form.nome.trim(),
          setor: form.setor,
          cargo: form.cargo,
        };
        if (form.id.trim()) payload.id = parseInt(form.id.trim());
        if (templateBase64) payload.template_base64 = templateBase64;
        await biometryService.createUsuario(payload);
        setFeedback({ tipo: 'success', msg: 'Membro cadastrado com sucesso!' });
      }
      await fetchUsuarios();
      setTimeout(() => fecharSheet(), 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      setFeedback({ tipo: 'error', msg });
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletando(true);
    try {
      await biometryService.deleteUsuario(confirmDelete.id);
      setConfirmDelete(null);
      await fetchUsuarios();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.');
    } finally {
      setDeletando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch = u.nome.toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search);
    const matchSetor = filtroSetor === 'Todos' || u.setor === filtroSetor;
    return matchSearch && matchSetor;
  });

  const getCargoBadgeColor = (cargo: string) => {
    if (cargo.includes('Capitão')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (cargo.includes('Diretor')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (cargo.includes('Trainee')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Topo Clean */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Membros da Equipe
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{usuarios.length} membros cadastrados no sistema</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20 transition font-bold text-sm active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Membro
        </button>
      </div>

      {/* Filtros Clean */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition shadow-xs"
          />
        </div>
        <select
          value={filtroSetor}
          onChange={e => setFiltroSetor(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition shadow-xs"
        >
          <option value="Todos">Todos os Setores</option>
          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid de membros — Cards Brancos com elevação suave */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> Carregando membros...
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-bold text-slate-700">Nenhum membro encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Cadastre o primeiro integrante da equipe Baja Gralha.</p>
          <button onClick={abrirNovo} className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Cadastrar primeiro membro →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {usuariosFiltrados.map(u => (
            <div
              key={u.id}
              className="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col gap-3.5 hover:border-blue-300 hover:shadow-md transition group shadow-xs"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                    {u.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{u.nome}</p>
                    <p className="text-xs text-slate-400 font-mono">ID #{u.id}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => abrirEdicao(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Editar Membro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remover Membro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCargoBadgeColor(u.cargo)}`}>
                  {u.cargo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                  {u.setor}
                </span>
              </div>

              {/* Footer do card */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {u.tem_biometria ? (
                    <><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700">Digital Ativa</span></>
                  ) : (
                    <><ShieldOff className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-400">Sem digital</span></>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-mono font-medium">{u.total_presencas} presença(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet de Cadastro / Edição — Clean White */}
      <Sheet
        open={sheetOpen}
        onClose={fecharSheet}
        title={editando ? 'Editar Membro' : 'Novo Membro'}
        subtitle={editando ? `Alterando dados de ${editando.nome}` : 'Cadastre um novo integrante e capture a digital no leitor USB'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={fecharSheet}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Membro'}
            </button>
          </div>
        }
      >
        {/* Feedback */}
        {feedback && (
          <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.tipo === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {feedback.tipo === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
            {feedback.msg}
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          {!editando && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ID / Matrícula <span className="text-slate-400 font-normal">(opcional — gerado automaticamente se vazio)</span>
              </label>
              <input
                type="number"
                placeholder="Ex: 101"
                value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Brenda Garcez"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Setor</label>
              <select
                value={form.setor}
                onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
              >
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cargo</label>
              <select
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
              >
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Leitor Biométrico Integrado — Clean White & Blue */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Fingerprint className="w-4 h-4 text-blue-600" />
                Leitor Biométrico DigitalPersona USB
              </div>
              {templateBase64 ? (
                <span className="text-emerald-700 font-mono text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Digital Lida!
                </span>
              ) : editando?.tem_biometria ? (
                <span className="text-blue-700 text-[11px] font-semibold">Digital salva (opcional alterar)</span>
              ) : (
                <span className="text-slate-400 text-[11px]">Encoste o dedo no sensor</span>
              )}
            </div>

            <BiometricScanner
              state={scannerState}
              onStart={startCapture}
              onReset={resetCapture}
              hasTemplate={Boolean(templateBase64)}
            />

            {templateBase64 && (
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                Digital pronta para ser salva no perfil do membro!
              </div>
            )}
          </div>
        </div>
      </Sheet>

      {/* Modal de confirmação de exclusão — Clean White */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Remover Membro</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confirma a remoção de <strong className="text-slate-800">{confirmDelete.nome}</strong>? 
                  Todos os registros de ponto dele serão desvinculados.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletando}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {deletando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletando ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
