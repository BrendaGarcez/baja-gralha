import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseInstances } from './firebaseConfig';
import type {
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  RegistroPonto,
  RegistroResponse,
  RelatorioMensal,
  MembroHorasResumo,
} from './types';

const MESES_PT = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatarMinutos(minutosTotais: number): string {
  const horas = Math.floor(minutosTotais / 60);
  const mins = minutosTotais % 60;
  if (horas > 0) {
    return `${horas}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${mins}m`;
}

function dataParaISO(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val.toDate && typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export const firebaseService = {
  // ==========================================
  // USUÁRIOS (MEMBROS)
  // ==========================================
  async getUsuarios(): Promise<Usuario[]> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const colRef = collection(db, 'usuarios');
    const snapshot = await getDocs(colRef);

    const usuarios: Usuario[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      usuarios.push({
        id: Number(data.id ?? docSnap.id),
        nome: data.nome || 'Sem Nome',
        setor: data.setor || 'Geral',
        cargo: data.cargo || 'Membro',
        tem_biometria: Boolean(data.template_base64),
        total_presencas: Number(data.total_presencas || 0),
        data_cadastro: dataParaISO(data.data_cadastro),
      });
    });

    return usuarios.sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async createUsuario(payload: UsuarioCreate): Promise<Usuario> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    let novoId = payload.id;
    if (novoId === undefined || novoId === null) {
      // Pega o maior id existente ou inicia em 101
      const todos = await this.getUsuarios();
      const maxId = todos.reduce((max, u) => Math.max(max, u.id), 100);
      novoId = maxId + 1;
    } else {
      // Verifica duplicidade
      const userDocRef = doc(db, 'usuarios', String(novoId));
      const existing = await getDoc(userDocRef);
      if (existing.exists()) {
        throw new Error(`Já existe um membro cadastrado com o ID #${novoId}.`);
      }
    }

    const agora = new Date();
    const novoUsuario: Usuario = {
      id: Number(novoId),
      nome: payload.nome.trim(),
      setor: payload.setor?.trim() || 'Geral',
      cargo: payload.cargo?.trim() || 'Membro',
      tem_biometria: Boolean(payload.template_base64),
      total_presencas: 0,
      data_cadastro: agora.toISOString(),
    };

    const docRef = doc(db, 'usuarios', String(novoId));
    await setDoc(docRef, {
      ...novoUsuario,
      template_base64: payload.template_base64 || null,
      data_cadastro: Timestamp.fromDate(agora),
    });

    return novoUsuario;
  },

  async updateUsuario(id: number, payload: UsuarioUpdate): Promise<Usuario> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const docRef = doc(db, 'usuarios', String(id));
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Membro com ID #${id} não encontrado no Firebase.`);
    }

    const atual = snap.data();
    const atualizacoes: any = {};

    if (payload.nome !== undefined) atualizacoes.nome = payload.nome.trim();
    if (payload.setor !== undefined) atualizacoes.setor = payload.setor.trim();
    if (payload.cargo !== undefined) atualizacoes.cargo = payload.cargo.trim();
    if (payload.template_base64 !== undefined) {
      atualizacoes.template_base64 = payload.template_base64;
      atualizacoes.tem_biometria = Boolean(payload.template_base64);
    }

    await updateDoc(docRef, atualizacoes);

    return {
      id,
      nome: atualizacoes.nome ?? atual.nome,
      setor: atualizacoes.setor ?? atual.setor ?? 'Geral',
      cargo: atualizacoes.cargo ?? atual.cargo ?? 'Membro',
      tem_biometria: atualizacoes.tem_biometria ?? Boolean(atual.template_base64),
      total_presencas: Number(atual.total_presencas || 0),
      data_cadastro: dataParaISO(atual.data_cadastro),
    };
  },

  async deleteUsuario(id: number): Promise<void> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const docRef = doc(db, 'usuarios', String(id));
    await deleteDoc(docRef);
  },

  // ==========================================
  // PONTO BIOMÉTRICO (REGISTROS)
  // ==========================================
  async registrarPonto(payload: {
    usuario_id: string;
    nome: string;
    template_base64: string;
  }): Promise<RegistroResponse> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const userIdNum = parseInt(payload.usuario_id.trim(), 10);
    if (isNaN(userIdNum)) {
      throw new Error('ID de usuário inválido.');
    }

    const agora = new Date();
    const dataStringHoje = agora.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Garante ou atualiza usuário no Firestore
    const userDocRef = doc(db, 'usuarios', String(userIdNum));
    const userSnap = await getDoc(userDocRef);

    let usuarioNome = payload.nome.trim();
    let usuarioSetor = 'Geral';

    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        id: userIdNum,
        nome: usuarioNome,
        setor: 'Geral',
        cargo: 'Membro',
        tem_biometria: Boolean(payload.template_base64),
        template_base64: payload.template_base64,
        total_presencas: 1,
        data_cadastro: Timestamp.fromDate(agora),
      });
    } else {
      const uData = userSnap.data();
      usuarioNome = uData.nome || usuarioNome;
      usuarioSetor = uData.setor || 'Geral';
      const updates: any = {};
      if (payload.template_base64 && !uData.template_base64) {
        updates.template_base64 = payload.template_base64;
        updates.tem_biometria = true;
      }
      if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates);
      }
    }

    // 2. Busca registro de hoje para o usuário
    const regCol = collection(db, 'registros_ponto');
    const qHoje = query(
      regCol,
      where('usuario_id', '==', userIdNum),
      where('data_chave', '==', dataStringHoje)
    );
    const registrosHojeSnap = await getDocs(qHoje);

    let tipo = 'Entrada';

    if (!registrosHojeSnap.empty) {
      // Já existe registro hoje: atualiza saída
      const regDocSnap = registrosHojeSnap.docs[0];
      const regData = regDocSnap.data();
      const horaEntradaDate = regData.hora_entrada ? new Date(dataParaISO(regData.hora_entrada)) : agora;
      const duracaoMinutos = Math.max(0, Math.floor((agora.getTime() - horaEntradaDate.getTime()) / 60000));

      await updateDoc(regDocSnap.ref, {
        hora_saida: Timestamp.fromDate(agora),
        duracao_minutos: duracaoMinutos,
      });
      tipo = regData.hora_saida ? 'Saída Atualizada' : 'Saída';
    } else {
      // Primeiro registro do dia: entrada
      const regId = `${userIdNum}_${agora.getTime()}`;
      await setDoc(doc(db, 'registros_ponto', regId), {
        id: agora.getTime(),
        usuario_id: userIdNum,
        usuario_nome: usuarioNome,
        setor: usuarioSetor,
        data_chave: dataStringHoje,
        data_registro: Timestamp.fromDate(agora),
        hora_entrada: Timestamp.fromDate(agora),
        hora_saida: null,
        duracao_minutos: null,
      });

      // Incrementa presenças do membro
      if (userSnap.exists()) {
        const curPres = Number(userSnap.data()?.total_presencas || 0);
        await updateDoc(userDocRef, { total_presencas: curPres + 1 });
      }
    }

    return {
      success: true,
      tipo,
      mensagem: `${tipo} registrada com sucesso no Firebase para ${usuarioNome}!`,
    };
  },

  async getRegistros(usuarioId?: number): Promise<RegistroPonto[]> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const colRef = collection(db, 'registros_ponto');
    let q = query(colRef, orderBy('data_registro', 'desc'));
    if (usuarioId !== undefined) {
      q = query(colRef, where('usuario_id', '==', usuarioId), orderBy('data_registro', 'desc'));
    }

    const snapshot = await getDocs(q);
    const registros: RegistroPonto[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const entradaISO = data.hora_entrada ? dataParaISO(data.hora_entrada) : null;
      const saidaISO = data.hora_saida ? dataParaISO(data.hora_saida) : null;

      let duracao = data.duracao_minutos;
      if (duracao === null || duracao === undefined) {
        if (entradaISO && saidaISO) {
          const tEntrada = new Date(entradaISO).getTime();
          const tSaida = new Date(saidaISO).getTime();
          duracao = Math.max(0, Math.floor((tSaida - tEntrada) / 60000));
        }
      }

      registros.push({
        id: Number(data.id || docSnap.id),
        usuario_id: Number(data.usuario_id),
        usuario_nome: data.usuario_nome || `ID #${data.usuario_id}`,
        setor: data.setor || 'Geral',
        data_registro: dataParaISO(data.data_registro),
        hora_entrada: entradaISO,
        hora_saida: saidaISO,
        duracao_minutos: duracao !== undefined ? Number(duracao) : null,
      });
    });

    return registros;
  },

  // ==========================================
  // RELATÓRIO MENSAL
  // ==========================================
  async getRelatorioMensal(
    mes: number,
    ano: number,
    usuarioId?: number,
    setor?: string
  ): Promise<RelatorioMensal> {
    const todosRegistros = await this.getRegistros(usuarioId);
    const todosUsuarios = await this.getUsuarios();

    const mapaUsuarios = new Map<number, Usuario>();
    todosUsuarios.forEach(u => mapaUsuarios.set(u.id, u));

    // Filtra pelo mês e ano desejados
    const registrosFiltrados = todosRegistros.filter(reg => {
      const d = new Date(reg.data_registro);
      const bateMes = (d.getMonth() + 1) === mes;
      const bateAno = d.getFullYear() === ano;
      const bateSetor = !setor || setor === 'Todos' || reg.setor === setor;
      return bateMes && bateAno && bateSetor;
    });

    let totalMinutosGeral = 0;
    const diasComAtividade = new Set<string>();
    const membrosMap: { [key: number]: { usuario_id: number; nome: string; setor: string; cargo: string; minutos: number; dias: Set<string> } } = {};

    for (const reg of registrosFiltrados) {
      const diaChave = reg.data_registro.split('T')[0];
      diasComAtividade.add(diaChave);

      const duracao = reg.duracao_minutos || 0;
      totalMinutosGeral += duracao;

      const uid = reg.usuario_id;
      const uInfo = mapaUsuarios.get(uid);

      if (!membrosMap[uid]) {
        membrosMap[uid] = {
          usuario_id: uid,
          nome: reg.usuario_nome || uInfo?.nome || `ID #${uid}`,
          setor: reg.setor || uInfo?.setor || 'Geral',
          cargo: uInfo?.cargo || 'Membro',
          minutos: 0,
          dias: new Set<string>(),
        };
      }
      membrosMap[uid].minutos += duracao;
      membrosMap[uid].dias.add(diaChave);
    }

    const membrosResumo: MembroHorasResumo[] = Object.values(membrosMap)
      .sort((a, b) => b.minutos - a.minutos)
      .map(m => ({
        usuario_id: m.usuario_id,
        nome: m.nome,
        setor: m.setor,
        cargo: m.cargo,
        total_minutos: m.minutos,
        total_horas_formatado: formatarMinutos(m.minutos),
        total_dias_presente: m.dias.size,
      }));

    const numDias = diasComAtividade.size;
    const mediaMinDia = numDias > 0 ? Math.floor(totalMinutosGeral / numDias) : 0;

    return {
      mes,
      ano,
      mes_nome: MESES_PT[mes] || `Mês ${mes}`,
      total_acessos: registrosFiltrados.length,
      total_horas_trabalhadas_minutos: totalMinutosGeral,
      total_horas_formatado: formatarMinutos(totalMinutosGeral),
      membros_ativos_qtd: Object.keys(membrosMap).length,
      media_horas_dia_formatada: formatarMinutos(mediaMinDia),
      membros_resumo: membrosResumo,
      registros: registrosFiltrados,
    };
  },

  // ==========================================
  // MIGRAÇÃO / IMPORTAÇÃO DO BANCO LOCAL (SQLITE)
  // ==========================================
  async migrarDadosDoLocal(usuarios: Usuario[], registros: RegistroPonto[]): Promise<{ usuariosMigrados: number; registrosMigrados: number }> {
    const { db } = getFirebaseInstances();
    if (!db) throw new Error('Firebase não está configurado.');

    const batch = writeBatch(db);
    let uCount = 0;
    let rCount = 0;

    for (const u of usuarios) {
      const userRef = doc(db, 'usuarios', String(u.id));
      batch.set(userRef, {
        id: u.id,
        nome: u.nome,
        setor: u.setor || 'Geral',
        cargo: u.cargo || 'Membro',
        tem_biometria: u.tem_biometria || false,
        total_presencas: u.total_presencas || 0,
        data_cadastro: u.data_cadastro ? Timestamp.fromDate(new Date(u.data_cadastro)) : Timestamp.now(),
      }, { merge: true });
      uCount++;
    }

    for (const r of registros) {
      const regRef = doc(db, 'registros_ponto', `migrated_${r.id}_${r.usuario_id}`);
      const dataRegDate = r.data_registro ? new Date(r.data_registro) : new Date();
      batch.set(regRef, {
        id: r.id,
        usuario_id: r.usuario_id,
        usuario_nome: r.usuario_nome,
        setor: r.setor || 'Geral',
        data_chave: dataRegDate.toISOString().split('T')[0],
        data_registro: Timestamp.fromDate(dataRegDate),
        hora_entrada: r.hora_entrada ? Timestamp.fromDate(new Date(r.hora_entrada)) : null,
        hora_saida: r.hora_saida ? Timestamp.fromDate(new Date(r.hora_saida)) : null,
        duracao_minutos: r.duracao_minutos,
      }, { merge: true });
      rCount++;
    }

    await batch.commit();
    return { usuariosMigrados: uCount, registrosMigrados: rCount };
  }
};
