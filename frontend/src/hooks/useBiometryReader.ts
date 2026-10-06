import { useState, useRef, useCallback, useEffect } from 'react';
import { biometryService } from '../services/biometryService';
import { ScannerState } from '../services/types';

export function useBiometryReader() {
  const [scannerState, setScannerState] = useState<ScannerState>('IDLE');
  const [templateBase64, setTemplateBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPollingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  const stopCapture = useCallback(() => {
    isPollingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const resetCapture = useCallback(() => {
    stopCapture();
    setScannerState('IDLE');
    setTemplateBase64(null);
    setErrorMessage(null);
  }, [stopCapture]);

  const pollCycle = useCallback(async () => {
    if (!isPollingRef.current) return;

    abortControllerRef.current = new AbortController();

    try {
      const data = await biometryService.checkHardwareStatus(abortControllerRef.current.signal);

      if (!isPollingRef.current) return;

      if (data.status === 'PROCESSANDO') {
        setScannerState('PROCESSING');
        // Intervalo curto enquanto o dedo está em processamento
        timeoutIdRef.current = window.setTimeout(pollCycle, 400);
      } else if (data.status === 'LIDO' && data.template_base64) {
        setTemplateBase64(data.template_base64);
        setScannerState('SUCCESS');
        stopCapture();
      } else {
        // AGUARDANDO_DEDO
        setScannerState('WAITING_FINGER');
        timeoutIdRef.current = window.setTimeout(pollCycle, 600);
      }
    } catch (err: unknown) {
      if (!isPollingRef.current) return;

      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // Interrupção voluntária/esperada
      }

      setScannerState('OFFLINE');
      setErrorMessage(
        'Serviço local C# não detectado em localhost:5000. Certifique-se de que o executável C# (ConsoleApp1) está em execução com o leitor USB conectado.'
      );
      stopCapture();
    }
  }, [stopCapture]);

  const startCapture = useCallback(() => {
    resetCapture();
    isPollingRef.current = true;
    setScannerState('WAITING_FINGER');
    pollCycle();
  }, [resetCapture, pollCycle]);

  // Limpeza garantida ao desmontar
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    scannerState,
    templateBase64,
    errorMessage,
    startCapture,
    resetCapture,
  };
}
