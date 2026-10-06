// Estados retornados pelo microserviço C# (localhost:5000)
export type CsharpBiometricStatus = 'AGUARDANDO_DEDO' | 'PROCESSANDO' | 'LIDO';

export interface CsharpServiceResponse {
  status: CsharpBiometricStatus;
  template_base64?: string;
}

// Estados visuais da UI do Scanner
export type ScannerState = 
  | 'IDLE'               // Inicial / Parado
  | 'WAITING_FINGER'     // Captura iniciada, aguardando sensor USB
  | 'PROCESSING'         // Dedo detectado, extraindo minúcias
  | 'SUCCESS'            // Minúcias lidas e validadas
  | 'OFFLINE'            // Serviço C# inacessível na porta 5000
  | 'ERROR';             // Falha na leitura ou comunicação

// Payload exigido pelo endpoint FastAPI (/biometria/capturar)
export interface BiometriaRegistroPayload {
  usuario_id: string;
  nome: string;
  template_base64: string;
}

export interface RegistroResponse {
  success?: boolean;
  mensagem?: string;
  message?: string;
  tipo?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// ==========================================
// Tipos de Usuários (CRUD)
// ==========================================
export interface Usuario {
  id: number;
  nome: string;
  setor: string;
  cargo: string;
  tem_biometria: boolean;
  total_presencas: number;
  data_cadastro: string | null;
}

export interface UsuarioCreate {
  id?: number;
  nome: string;
  setor?: string;
  cargo?: string;
  template_base64?: string;
}

export interface UsuarioUpdate {
  nome?: string;
  setor?: string;
  cargo?: string;
  template_base64?: string;
}

// ==========================================
// Tipos de Registros de Ponto
// ==========================================
export interface RegistroPonto {
  id: number;
  usuario_id: number;
  usuario_nome: string;
  setor: string;
  data_registro: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  duracao_minutos: number | null;
}

// ==========================================
// Tipos do Relatório Mensal
// ==========================================
export interface MembroHorasResumo {
  usuario_id: number;
  nome: string;
  setor: string;
  cargo: string;
  total_minutos: number;
  total_horas_formatado: string;
  total_dias_presente: number;
}

export interface RelatorioMensal {
  mes: number;
  ano: number;
  mes_nome: string;
  total_acessos: number;
  total_horas_trabalhadas_minutos: number;
  total_horas_formatado: string;
  membros_ativos_qtd: number;
  media_horas_dia_formatada: string;
  membros_resumo: MembroHorasResumo[];
  registros: RegistroPonto[];
}
