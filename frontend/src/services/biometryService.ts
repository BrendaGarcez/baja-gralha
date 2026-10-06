import type {
  CsharpServiceResponse,
  BiometriaRegistroPayload,
  RegistroResponse,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  RegistroPonto,
  RelatorioMensal,
} from './types';
import { isFirebaseEnabled } from './firebaseConfig';
import { firebaseService } from './firebaseService';

const DEFAULT_CSHARP_URL = 'http://localhost:5000/';
const DEFAULT_API_BASE = 'http://127.0.0.1:8083';

export const biometryService = {
  // ==========================================
  // CONFIGURAÇÕES DE REDE / HARDWARE
  // ==========================================
  getHardwareUrl(): string {
    return localStorage.getItem('baja_hardware_url') || import.meta.env.VITE_CSHARP_SERVICE_URL || DEFAULT_CSHARP_URL;
  },

  setHardwareUrl(url: string): void {
    localStorage.setItem('baja_hardware_url', url);
  },

  getApiBase(): string {
    return localStorage.getItem('baja_api_base') || import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;
  },

  setApiBase(url: string): void {
    localStorage.setItem('baja_api_base', url);
  },

  isFirebaseActive(): boolean {
    return isFirebaseEnabled();
  },

  // ==========================================
  // HARDWARE — Serviço C# local (porta 5000 ou túnel)
  // ==========================================
  async checkHardwareStatus(signal?: AbortSignal): Promise<CsharpServiceResponse> {
    const hwUrl = this.getHardwareUrl();
    const response = await fetch(hwUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error(`Falha no leitor biométrico (HTTP ${response.status})`);
    return response.json();
  },

  // ==========================================
  // PONTO BIOMÉTRICO
  // ==========================================
  async registrarPonto(payload: BiometriaRegistroPayload): Promise<RegistroResponse> {
    if (this.isFirebaseActive()) {
      return await firebaseService.registrarPonto(payload);
    }

    const apiBase = this.getApiBase();
    const response = await fetch(`${apiBase}/biometria/capturar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro na API central (HTTP ${response.status})`);
    }
    try {
      return await response.json();
    } catch {
      return { success: true, mensagem: 'Ponto registrado com sucesso!' };
    }
  },

  async getRegistros(usuarioId?: number): Promise<RegistroPonto[]> {
    if (this.isFirebaseActive()) {
      return await firebaseService.getRegistros(usuarioId);
    }

    const apiBase = this.getApiBase();
    const url = new URL(`${apiBase}/registros`);
    if (usuarioId !== undefined) url.searchParams.set('usuario_id', String(usuarioId));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Erro ao buscar registros (HTTP ${response.status})`);
    return response.json();
  },

  // ==========================================
  // USUÁRIOS — CRUD
  // ==========================================
  async getUsuarios(): Promise<Usuario[]> {
    if (this.isFirebaseActive()) {
      return await firebaseService.getUsuarios();
    }

    const apiBase = this.getApiBase();
    const response = await fetch(`${apiBase}/usuarios`);
    if (!response.ok) throw new Error(`Erro ao buscar membros (HTTP ${response.status})`);
    return response.json();
  },

  async createUsuario(payload: UsuarioCreate): Promise<Usuario> {
    if (this.isFirebaseActive()) {
      return await firebaseService.createUsuario(payload);
    }

    const apiBase = this.getApiBase();
    const response = await fetch(`${apiBase}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || `Erro ao criar membro (HTTP ${response.status})`);
    }
    return response.json();
  },

  async updateUsuario(id: number, payload: UsuarioUpdate): Promise<Usuario> {
    if (this.isFirebaseActive()) {
      return await firebaseService.updateUsuario(id, payload);
    }

    const apiBase = this.getApiBase();
    const response = await fetch(`${apiBase}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || `Erro ao atualizar membro (HTTP ${response.status})`);
    }
    return response.json();
  },

  async deleteUsuario(id: number): Promise<void> {
    if (this.isFirebaseActive()) {
      return await firebaseService.deleteUsuario(id);
    }

    const apiBase = this.getApiBase();
    const response = await fetch(`${apiBase}/usuarios/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || `Erro ao remover membro (HTTP ${response.status})`);
    }
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
    if (this.isFirebaseActive()) {
      return await firebaseService.getRelatorioMensal(mes, ano, usuarioId, setor);
    }

    const apiBase = this.getApiBase();
    const url = new URL(`${apiBase}/relatorios/mensal`);
    url.searchParams.set('mes', String(mes));
    url.searchParams.set('ano', String(ano));
    if (usuarioId !== undefined) url.searchParams.set('usuario_id', String(usuarioId));
    if (setor && setor !== 'Todos') url.searchParams.set('setor', setor);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Erro ao buscar relatório (HTTP ${response.status})`);
    return response.json();
  },

  // Helper para buscar dados do backend local FastAPI para migração
  async fetchLocalDataForMigration(): Promise<{ usuarios: Usuario[]; registros: RegistroPonto[] }> {
    const apiBase = this.getApiBase();
    const [resU, resR] = await Promise.all([
      fetch(`${apiBase}/usuarios`),
      fetch(`${apiBase}/registros`),
    ]);
    if (!resU.ok) throw new Error(`Falha ao conectar no backend local (${apiBase}/usuarios)`);
    const usuarios = await resU.json();
    const registros = resR.ok ? await resR.json() : [];
    return { usuarios, registros };
  }
};
