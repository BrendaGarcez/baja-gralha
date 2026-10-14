/**
 * Utilitários de Fuso Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
 * Garante que o cálculo de hoje, entrada, saída e relatórios respeitem rigorosamente
 * o horário oficial de Brasília independentemente do fuso da máquina ou do servidor.
 */

export interface BrasiliaDateTime {
  dataChave: string;       // Formato: "YYYY-MM-DD" no fuso de Brasília
  dataBR: string;          // Formato: "DD/MM/YYYY"
  horaFormatada: string;   // Formato: "HH:mm"
  horaSegundos: string;    // Formato: "HH:mm:ss"
  ano: number;
  mes: number;             // 1-12
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

export function getBrasiliaParts(date: Date = new Date()): BrasiliaDateTime {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const ano = parseInt(getPart('year'), 10) || date.getFullYear();
  const mes = parseInt(getPart('month'), 10) || (date.getMonth() + 1);
  const dia = parseInt(getPart('day'), 10) || date.getDate();
  const hh = getPart('hour').padStart(2, '0');
  const mm = getPart('minute').padStart(2, '0');
  const ss = getPart('second').padStart(2, '0');

  const yyyyStr = String(ano);
  const mmStr = String(mes).padStart(2, '0');
  const ddStr = String(dia).padStart(2, '0');

  return {
    dataChave: `${yyyyStr}-${mmStr}-${ddStr}`,
    dataBR: `${ddStr}/${mmStr}/${yyyyStr}`,
    horaFormatada: `${hh}:${mm}`,
    horaSegundos: `${hh}:${mm}:${ss}`,
    ano,
    mes,
    dia,
    hora: parseInt(hh, 10),
    minuto: parseInt(mm, 10),
    segundo: parseInt(ss, 10),
  };
}

export function formatarDataBrasilia(dateInput: Date | string | number | null | undefined, comHora = false): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const parts = getBrasiliaParts(d);
  if (comHora) {
    return `${parts.dataBR} às ${parts.horaFormatada}`;
  }
  return parts.dataBR;
}

export function formatarHoraBrasilia(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  return getBrasiliaParts(d).horaFormatada;
}

export function isHojeEmBrasilia(dateInput: Date | string | number | null | undefined): boolean {
  if (!dateInput) return false;
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return false;

  const hoje = getBrasiliaParts(new Date()).dataChave;
  const regDia = getBrasiliaParts(d).dataChave;
  return hoje === regDia;
}
