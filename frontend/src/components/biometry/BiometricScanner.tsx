import type { FC } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, RefreshCw, Radio, Loader2 } from 'lucide-react';
import { ScannerState } from '../../services/types';

interface BiometricScannerProps {
  state: ScannerState;
  onStart: () => void;
  onReset: () => void;
  hasTemplate: boolean;
}

export const BiometricScanner: FC<BiometricScannerProps> = ({
  state,
  onStart,
  onReset,
  hasTemplate,
}) => {
  const getVisualConfig = () => {
    switch (state) {
      case 'WAITING_FINGER':
        return {
          containerClass: 'border-blue-500 bg-blue-50/40 shadow-xs shadow-blue-500/10',
          iconColor: 'text-blue-600',
          badgeText: 'Aguardando dedo no sensor',
          statusText: 'Posicione o dedo indicador no leitor USB',
          subText: 'Mantenha o dedo firme até a confirmação',
        };
      case 'PROCESSING':
        return {
          containerClass: 'border-blue-400 bg-blue-50/30',
          iconColor: 'text-blue-600',
          badgeText: 'Processando digital',
          statusText: 'Identificando minúcias...',
          subText: 'Aguarde a validação biométrica',
        };
      case 'SUCCESS':
        return {
          containerClass: 'border-emerald-500 bg-emerald-50/40',
          iconColor: 'text-emerald-700',
          badgeText: 'Leitura concluída',
          statusText: 'Digital lida com sucesso',
          subText: 'Identidade pronta para confirmação de ponto',
        };
      case 'OFFLINE':
      case 'ERROR':
        return {
          containerClass: 'border-rose-300 bg-rose-50/40',
          iconColor: 'text-rose-600',
          badgeText: 'Leitor desconectado',
          statusText: 'Serviço USB não detectado',
          subText: 'Verifique se o serviço local está ativo na porta 5000',
        };
      case 'IDLE':
      default:
        return {
          containerClass: 'border-slate-200 bg-slate-50/50',
          iconColor: 'text-slate-400',
          badgeText: 'Em espera',
          statusText: 'Sensor pronto para captura',
          subText: 'Clique abaixo para ativar a leitura biométrica',
        };
    }
  };

  const config = getVisualConfig();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-2xs">
      {/* Sensor Icon / Status Container */}
      <div className="flex flex-col items-center mb-4">
        <div
          className={`relative flex items-center justify-center w-24 h-24 rounded-full border transition-colors ${config.containerClass}`}
        >
          {state === 'SUCCESS' ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-700" />
          ) : state === 'OFFLINE' || state === 'ERROR' ? (
            <AlertCircle className="w-10 h-10 text-rose-600" />
          ) : state === 'PROCESSING' ? (
            <Loader2 className="w-10 h-10 text-slate-700 animate-spin" />
          ) : (
            <Fingerprint className={`w-10 h-10 ${config.iconColor}`} />
          )}
        </div>
      </div>

      {/* Informações de Estado (IHC: Visibilidade de Estado do Sistema) */}
      <div className="text-center mb-5 max-w-xs">
        <span className="inline-block text-[11px] font-medium text-slate-500 mb-1">
          {config.badgeText}
        </span>
        <h4 className="text-sm font-semibold text-slate-900">
          {config.statusText}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          {config.subText}
        </p>
      </div>

      {/* Ações (IHC: Controle e Liberdade do Usuário) */}
      <div className="w-full max-w-xs">
        {state === 'IDLE' ? (
          <button
            type="button"
            onClick={onStart}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition shadow-xs shadow-blue-600/20 active:scale-98"
          >
            <Radio className="w-3.5 h-3.5" />
            Ativar Leitor Biométrico
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-300 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reiniciar Leitor
          </button>
        )}
      </div>

      {hasTemplate && state === 'SUCCESS' && (
        <p className="mt-3 text-[11px] text-emerald-700 font-medium">
          Digital armazenada na sessão temporária
        </p>
      )}
    </div>
  );
};
