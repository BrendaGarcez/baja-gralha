import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Trash2, Edit2, Fingerprint, ShieldCheck,
  ShieldOff, AlertTriangle, Loader2, CheckCircle2
} from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
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
  capturarBiometria: boolean;
}

const FORM_INICIAL: FormState = {
  id: '', nome: '', setor: 'Geral', cargo: 'Membro', capturarBiometria: false,
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
    resetCapture();
    setSheetOpen(true);
  };

  const abrirEdicao = (u: Usuario) => {
    setEditando(u);
    setForm({ id: String(u.id), nome: u.nome, setor: u.setor, cargo: u.cargo, capturarBiometria: false });
    setFeedback(null);
    resetCapture();
    setSheetOpen(true);
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
        if (form.capturarBiometria && templateBase64) {
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
        if (form.capturarBiometria && templateBase64) payload.template_base64 = templateBase64;
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
    if (cargo.includes('Capitão')) return 'bg-amber-950/80 text-amber-300 border-amber-800';
    if (cargo.includes('Diretor')) return 'bg-purple-950/80 text-purple-300 border-purple-800';
    if (cargo.includes('Trainee')) return 'bg-slate-800 text-slate-400 border-slate-700';
    return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-500" />
            Membros & Cadastro
          </h2>
          <p className="text-slate-400 text-sm mt-1">{usuarios.length} membros cadastrados</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-900/30 transition font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Membro
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600 transition"
          />
        </div>
        <select
          value={filtroSetor}
          onChange={e => setFiltroSetor(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-600 transition"
        >
          <option value="Todos">Todos os Setores</option>
          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid de membros */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando membros...
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhum membro encontrado.</p>
          <button onClick={abrirNovo} className="mt-4 text-cyan-400 hover:underline text-sm">
            Cadastrar primeiro membro →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {usuariosFiltrados.map(u => (
            <div
              key={u.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition group"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-700 to-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm truncate">{u.nome}</p>
                    <p className="text-xs text-slate-500">ID #{u.id}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => abrirEdicao(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCargoBadgeColor(u.cargo)}`}>
                  {u.cargo}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 text-slate-400 border-slate-700">
                  {u.setor}
                </span>
              </div>

              {/* Footer do card */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  {u.tem_biometria ? (
                    <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Biometria ok</span></>
                  ) : (
                    <><ShieldOff className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-500">Sem biometria</span></>
                  )}
                </div>
                <span className="text-xs text-slate-500">{u.total_presencas} presenças</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet de Cadastro / Edição */}
      <Sheet
        open={sheetOpen}
        onClose={fecharSheet}
        title={editando ? 'Editar Membro' : 'Novo Membro'}
        subtitle={editando ? `Editando ${editando.nome}` : 'Preencha os dados do novo integrante da equipe Baja Gralha'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={fecharSheet}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Membro'}
            </button>
          </div>
        }
      >
        {/* Feedback */}
        {feedback && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-xs font-medium border ${
            feedback.tipo === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700 text-rose-300'
          }`}>
            {feedback.tipo === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            {feedback.msg}
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          {!editando && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                ID / Matrícula <span className="text-slate-600 font-normal">(opcional — gerado automaticamente)</span>
              </label>
              <input
                type="number"
                placeholder="Ex: 101"
                value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Nome Completo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Brenda Garcez"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Setor</label>
              <select
                value={form.setor}
                onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-600 transition"
              >
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cargo</label>
              <select
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-600 transition"
              >
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Biometria opcional */}
          <div className="border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Fingerprint className="w-4 h-4 text-cyan-500" />
                Biometria (opcional)
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, capturarBiometria: !f.capturarBiometria }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.capturarBiometria ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  form.capturarBiometria ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {form.capturarBiometria && (
              <div className="space-y-3">
                {scannerState === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startCapture}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    Iniciar Captura Biométrica
                  </button>
                )}
                {scannerState === 'WAITING_FINGER' && (
                  <div className="text-center py-3 text-cyan-400 text-xs font-semibold animate-pulse">
                    Aguardando dedo no sensor...
                  </div>
                )}
                {scannerState === 'PROCESSING' && (
                  <div className="text-center py-3 text-amber-400 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Processando biometria...
                  </div>
                )}
                {scannerState === 'SUCCESS' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-800 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Biometria capturada com sucesso!
                  </div>
                )}
                {(scannerState === 'OFFLINE' || scannerState === 'ERROR') && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Serviço biométrico offline. Verifique o ConsoleApp1.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Sheet>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.8)' }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Remover Membro</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confirma a remoção de <strong className="text-slate-200">{confirmDelete.nome}</strong>? 
                  Todos os registros de ponto serão excluídos permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletando}
                className="flex-1 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
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
