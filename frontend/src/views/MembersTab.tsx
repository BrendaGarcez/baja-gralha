import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Trash2, Edit2, Fingerprint, ShieldCheck,
  ShieldOff, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
import { BiometricScanner } from '../components/biometry/BiometricScanner';
import { biometryService } from '../services/biometryService';
import { useBiometryReader } from '../hooks/useBiometryReader';
import type { Usuario, UsuarioCreate, UsuarioUpdate } from '../services/types';

const SETORES = ['Gestão', 'Projetos', 'Marketing', 'Manufatura', 'Tríplice', 'Trainee'];
const CARGOS = ['Capitão', 'Diretor', 'Membro Efetivo', 'Trainee', 'Membro'];

interface FormState {
  id: string;
  nome: string;
  setor: string;
  cargo: string;
}

const FORM_INICIAL: FormState = {
  id: '', nome: '', setor: 'Projetos', cargo: 'Membro',
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
    startCapture();
  };

  const abrirEdicao = (u: Usuario) => {
    setEditando(u);
    setForm({ id: String(u.id), nome: u.nome, setor: u.setor, cargo: u.cargo });
    setFeedback(null);
    setSheetOpen(true);
    startCapture();
  };

  const fecharSheet = () => {
    setSheetOpen(false);
    resetCapture();
    setFeedback(null);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setFeedback({ tipo: 'error', msg: 'O nome do membro é obrigatório.' });
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
        setFeedback({ tipo: 'success', msg: 'Dados atualizados com sucesso.' });
      } else {
        const payload: UsuarioCreate = {
          nome: form.nome.trim(),
          setor: form.setor,
          cargo: form.cargo,
        };
        if (form.id.trim()) payload.id = parseInt(form.id.trim());
        if (templateBase64) payload.template_base64 = templateBase64;
        await biometryService.createUsuario(payload);
        setFeedback({ tipo: 'success', msg: 'Membro cadastrado com sucesso.' });
      }
      await fetchUsuarios();
      setTimeout(() => fecharSheet(), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao salvar dados.';
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
      alert(e instanceof Error ? e.message : 'Falha ao excluir membro.');
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

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Topo Limpo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Equipe & Membros</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {usuarios.length} membros cadastrados com registro biométrico
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-medium shadow-xs shadow-blue-600/20 active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          Cadastrar Membro
        </button>
      </div>

      {/* Barra de Busca e Filtros (IHC: Eficiência de Uso) */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-2xs"
          />
        </div>
        <select
          value={filtroSetor}
          onChange={e => setFiltroSetor(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-slate-500 shadow-2xs sm:w-48"
        >
          <option value="Todos">Todos os Setores</option>
          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Lista de Membros (IHC: Consistência e Escaneabilidade Visual) */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-600" />
          <span className="text-xs">Carregando lista de membros...</span>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhum membro encontrado</p>
          <p className="text-xs text-slate-400 mt-0.5">Tente ajustar os filtros ou adicione um novo integrante.</p>
          <button
            onClick={abrirNovo}
            className="mt-3 text-xs text-slate-700 font-medium underline underline-offset-4 hover:text-slate-900"
          >
            Cadastrar membro agora
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Colaborador</th>
                  <th className="px-4 py-2.5">Setor & Cargo</th>
                  <th className="px-4 py-2.5 text-center">Biometria</th>
                  <th className="px-4 py-2.5 text-center">Presenças</th>
                  <th className="px-4 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.nome}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID #{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-800">{u.setor}</p>
                      <p className="text-[11px] text-slate-400">{u.cargo?.replace(/\s*\/\s*Estagiário/gi, '').replace(/^Estagiário$/gi, 'Trainee') || 'Membro'}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {u.tem_biometria ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Cadastrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <ShieldOff className="w-3 h-3 text-slate-400" /> Pendente
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-800">
                      {u.total_presencas}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => abrirEdicao(u)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Editar cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Excluir membro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gaveta Lateral (Sheet) para Cadastro / Edição */}
      <Sheet
        open={sheetOpen}
        onClose={fecharSheet}
        title={editando ? 'Editar Membro' : 'Novo Membro'}
        subtitle={editando ? `Atualize as informações de ${editando.nome}` : 'Preencha os dados e capture a digital no leitor USB'}
        footer={
          <div className="flex gap-2">
            <button
              onClick={fecharSheet}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs shadow-blue-600/20 active:scale-98"
            >
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Concluir Cadastro'}
            </button>
          </div>
        }
      >
        {feedback && (
          <div className={`p-3 rounded-lg text-xs font-medium border mb-4 ${
            feedback.tipo === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
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

        <div className="space-y-3.5">
          {!editando && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ID / Matrícula <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                placeholder="Gerado automaticamente se vazio"
                value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 font-mono shadow-2xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Brenda Garcez"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Setor</label>
              <select
                value={form.setor}
                onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-500 shadow-2xs"
              >
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cargo</label>
              <select
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-500 shadow-2xs"
              >
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Seção Biométrica */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-slate-600" /> Leitura Biométrica USB
              </span>
              {templateBase64 ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Digital pronta
                </span>
              ) : editando?.tem_biometria ? (
                <span className="text-slate-500">Digital já gravada</span>
              ) : (
                <span className="text-slate-400">Aguardando dedo</span>
              )}
            </div>

            <BiometricScanner
              state={scannerState}
              onStart={startCapture}
              onReset={resetCapture}
              hasTemplate={Boolean(templateBase64)}
            />
          </div>
        </div>
      </Sheet>

      {/* Confirmação de Exclusão (IHC: Prevenção de Erros Graves) */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Confirmar Exclusão</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja remover <strong>{confirmDelete.nome}</strong>? Os registros de ponto anteriores serão desvinculados deste membro.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletando}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition flex items-center gap-1.5"
              >
                {deletando && <Loader2 className="w-3 h-3 animate-spin" />}
                Remover Membro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
