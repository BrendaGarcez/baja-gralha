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
          ringColor: 'border-cyan-500 shadow-lg shadow-cyan-500/20',
          iconColor: 'text-cyan-400',
          statusText: 'Aguardando dedo no leitor USB...',
          subText: 'Posicione o dedo indicador firmemente no sensor',
          showRipple: true,
        };
      case 'PROCESSING':
        return {
          ringColor: 'border-amber-500 shadow-lg shadow-amber-500/30 animate-pulse',
          iconColor: 'text-amber-400',
          statusText: 'Processando biometria...',
          subText: 'Extraindo minúcias e gerando template...',
          showRipple: false,
        };
      case 'SUCCESS':
        return {
          ringColor: 'border-emerald-500 shadow-lg shadow-emerald-500/30',
          iconColor: 'text-emerald-400',
          statusText: 'Digital lida com sucesso!',
          subText: 'Template biométrico gerado e pronto para envio',
          showRipple: false,
        };
      case 'OFFLINE':
      case 'ERROR':
        return {
          ringColor: 'border-rose-500 shadow-lg shadow-rose-500/20',
          iconColor: 'text-rose-400',
          statusText: 'Serviço C# não detectado',
          subText: 'Execute o ConsoleApp1 e certifique-se da porta 5000',
          showRipple: false,
        };
      case 'IDLE':
      default:
        return {
          ringColor: 'border-slate-800 hover:border-slate-700',
          iconColor: 'text-slate-500',
          statusText: 'Sensor em repouso',
          subText: 'Clique no botão abaixo para habilitar a captura',
          showRipple: false,
        };
    }
  };

  const config = getVisualConfig();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm transition">
      {/* Visual do Sensor */}
      <div className="relative flex items-center justify-center mb-6 mt-2">
        {config.showRipple && (
          <div className="absolute w-36 h-36 rounded-full border border-cyan-500/40 animate-ping" />
        )}

        <div
          className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full border-2 bg-slate-950/90 shadow-2xl transition-all duration-300 ${config.ringColor}`}
        >
          {state === 'SUCCESS' ? (
            <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
          ) : state === 'OFFLINE' || state === 'ERROR' ? (
            <AlertCircle className="w-14 h-14 text-rose-400" />
          ) : (
            <Fingerprint className={`w-14 h-14 transition-colors duration-300 ${config.iconColor}`} />
          )}
        </div>
      </div>

      {/* Descrição do Estado */}
      <div className="text-center space-y-1 mb-6">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center justify-center gap-2">
          {state === 'WAITING_FINGER' && <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />}
          {config.statusText}
        </h4>
        <p className="text-xs text-slate-400 max-w-xs">{config.subText}</p>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        {state === 'WAITING_FINGER' || state === 'PROCESSING' ? (
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Cancelar Leitura
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={hasTemplate}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-900/30 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Fingerprint className="w-4 h-4" />
            {hasTemplate ? 'Digital Pronta' : 'Iniciar Captura'}
          </button>
        )}
      </div>
    </div>
  );
};
