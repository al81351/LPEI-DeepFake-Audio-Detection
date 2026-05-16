import { useState, useRef, useCallback, useEffect } from 'react';
import type { RealtimeUpdate, RealtimeStatus } from '../types/analysis';
import { createWebSocketStream } from '../services/websocket';
import type { WSController } from '../services/websocket';

interface UseRealtimeStreamReturn {
  update: RealtimeUpdate | null;
  status: RealtimeStatus;
  error: string | null;
  startCapture: (threshold: number) => Promise<void>;
  stopCapture: () => void;
}

export function useRealtimeStream(): UseRealtimeStreamReturn {
  const [update, setUpdate] = useState<RealtimeUpdate | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [error, setError]   = useState<string | null>(null);

  const wsRef        = useRef<WSController | null>(null);
  const contextRef   = useRef<AudioContext | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const stopCapture = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    void contextRef.current?.close();
    contextRef.current = null;

    wsRef.current?.close();
    wsRef.current = null;

    setStatus('idle');
    setUpdate(null);
  }, []);

  const startCapture = useCallback(async (threshold: number) => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('O teu browser não suporta captura de microfone');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SAMPLE_RATE = 22050;
      const context = new AudioContext({ sampleRate: SAMPLE_RATE });
      contextRef.current = context;

      const ws = createWebSocketStream(
        { sampleRate: SAMPLE_RATE, threshold },
        (data) => setUpdate(data),
        (msg) => {
          stopCapture();      // limpa recursos e define status='idle'
          setError(msg);      // guarda mensagem de erro
          setStatus('error'); // sobrepõe status para mostrar erro
        },
      );
      wsRef.current = ws;

      const source    = context.createMediaStreamSource(stream);
      // ScriptProcessorNode (deprecated mas de suporte universal)
      const processor = context.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        ws.sendChunk(new Float32Array(channelData));
      };

      source.connect(processor);
      // Ligação ao destination necessária para o callback disparar
      processor.connect(context.destination);

      setStatus('capturing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceder ao microfone');
      setStatus('error');
    }
  }, [stopCapture]);

  useEffect(() => {
    return () => { stopCapture(); };
  }, [stopCapture]);

  return { update, status, error, startCapture, stopCapture };
}
