import type { FC } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';
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
          ringColor: 'border-blue-500 shadow-xl shadow-blue-500/20 bg-blue-50/40',
          iconColor: 'text-blue-600',
          statusText: 'Aguardando dedo no leitor USB...',
          subText: 'Posicione o dedo indicador firmemente no sensor',
          showRipple: true,
        };
      case 'PROCESSING':
        return {
          ringColor: 'border-amber-500 shadow-xl shadow-amber-500/25 bg-amber-50/40 animate-pulse',
          iconColor: 'text-amber-600',
          statusText: 'Processando biometria...',
          subText: 'Extraindo minúcias e gerando template...',
          showRipple: false,
        };
      case 'SUCCESS':
        return {
          ringColor: 'border-emerald-500 shadow-xl shadow-emerald-500/25 bg-emerald-50/60',
          iconColor: 'text-emerald-600',
          statusText: 'Digital lida com sucesso!',
          subText: 'Template biométrico gerado e pronto para envio',
          showRipple: false,
        };
      case 'OFFLINE':
      case 'ERROR':
        return {
          ringColor: 'border-rose-400 shadow-lg shadow-rose-500/15 bg-rose-50/60',
          iconColor: 'text-rose-500',
          statusText: 'Serviço C# não detectado',
          subText: 'Execute o ConsoleApp1 e certifique-se da porta 5000',
          showRipple: false,
        };
      case 'IDLE':
      default:
        return {
          ringColor: 'border-slate-300 hover:border-slate-400 bg-slate-100/60',
          iconColor: 'text-slate-400',
          statusText: 'Sensor em repouso',
          subText: 'Clique no botão abaixo para habilitar a captura',
          showRipple: false,
        };
    }
  };

  const config = getVisualConfig();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-xs transition">
      {/* Visual do Sensor */}
      <div className="relative flex items-center justify-center mb-5 mt-2">
        {config.showRipple && (
          <div className="absolute w-36 h-36 rounded-full border-2 border-blue-400/40 animate-ping" />
        )}

        <div
          className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full border-2 shadow-inner transition-all duration-300 ${config.ringColor}`}
        >
          {state === 'SUCCESS' ? (
            <CheckCircle2 className="w-14 h-14 text-emerald-600 animate-bounce" />
          ) : state === 'OFFLINE' || state === 'ERROR' ? (
            <AlertCircle className="w-14 h-14 text-rose-500 animate-pulse" />
          ) : (
            <Fingerprint
              className={`w-14 h-14 transition-all duration-300 ${config.iconColor} ${
                state === 'WAITING_FINGER'
                  ? 'animate-pulse scale-105'
                  : state === 'PROCESSING'
                  ? 'animate-spin'
                  : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Textos de Estado com alta legibilidade (IHC) */}
      <div className="text-center mb-6">
        <h4 className="text-sm font-bold text-slate-800 transition-colors">
          {config.statusText}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          {config.subText}
        </p>
      </div>

      {/* Ações / Botões */}
      <div className="flex gap-2 w-full max-w-xs">
        {state === 'IDLE' ? (
          <button
            type="button"
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 active:scale-98 transition"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            Ativar Leitor
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 active:scale-98 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar Leitor
          </button>
        )}
      </div>

      {/* Indicador de Template Pronto */}
      {hasTemplate && state === 'SUCCESS' && (
        <div className="mt-4 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Biometria capturada com sucesso!
        </div>
      )}
    </div>
  );
};
