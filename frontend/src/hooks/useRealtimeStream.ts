import { useState, useRef, useCallback, useEffect } from 'react';
import type { RealtimeTick, RealtimeProbe, RealtimeStatus } from '../types/analysis';
import { createWebSocketStream } from '../services/websocket';
import type { WSController } from '../services/websocket';

interface UseRealtimeStreamReturn {
  tick: RealtimeTick | null;
  latestProbe: RealtimeProbe | null;
  probes: RealtimeProbe[];
  status: RealtimeStatus;
  error: string | null;
  startCapture: (threshold: number) => Promise<void>;
  stopCapture: () => void;
  clearProbes: () => void;
}

export function useRealtimeStream(): UseRealtimeStreamReturn {
  const [tick, setTick]               = useState<RealtimeTick | null>(null);
  const [latestProbe, setLatestProbe] = useState<RealtimeProbe | null>(null);
  const [probes, setProbes]           = useState<RealtimeProbe[]>([]);
  const [status, setStatus]           = useState<RealtimeStatus>('idle');
  const [error, setError]             = useState<string | null>(null);

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
    setTick(null);
    setLatestProbe(null);
    setProbes([]);
  }, []);

  const clearProbes = useCallback(() => {
    setProbes([]);
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
        (msg) => {
          if (msg.type === 'tick') {
            setTick(msg);
          } else if (msg.type === 'probe') {
            setLatestProbe(msg);
            setProbes(prev => [msg, ...prev]);
          }
        },
        (msg) => {
          stopCapture();
          setError(msg);
          setStatus('error');
        },
      );
      wsRef.current = ws;

      const source    = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        ws.sendChunk(new Float32Array(channelData));
      };

      source.connect(processor);
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

  return { tick, latestProbe, probes, status, error, startCapture, stopCapture, clearProbes };
}
