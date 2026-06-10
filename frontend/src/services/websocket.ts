import type { RealtimeMessage } from '../types/analysis';

// Build the WebSocket URL from VITE_API_URL (production) or fall back to the
// Vite dev-server proxy (local dev).  HTTPS pages require wss://, so we
// convert the scheme automatically instead of hardcoding ws://.
function buildWsUrl(): string {
  if (import.meta.env.DEV) {
    // Vite proxy forwards ws://localhost:5173/analyze-stream → ws://localhost:8000
    return `ws://${window.location.host}/analyze-stream`;
  }
  // Production: prefer env variable, fall back to the known Render deployment.
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    'https://digital-voice-shield.onrender.com';
  return apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/analyze-stream';
}
const WS_URL = buildWsUrl();

interface WSConfig {
  sampleRate: number;
  threshold: number;
}

export interface WSController {
  sendChunk(float32: Float32Array): void;
  updateThreshold(threshold: number): void;
  close(): void;
}

export function createWebSocketStream(
  config: WSConfig,
  onMessage: (msg: RealtimeMessage) => void,
  onError: (msg: string) => void,
): WSController {
  const ws = new WebSocket(WS_URL);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    ws.send(JSON.stringify({
      sample_rate: config.sampleRate,
      threshold: config.threshold,
    }));
  };

  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    try {
      const data = JSON.parse(event.data) as Record<string, unknown>;
      if (data['error']) {
        onError(String(data['error']));
      } else {
        onMessage(data as unknown as RealtimeMessage);
      }
    } catch {
      onError('Resposta inválida do servidor');
    }
  };

  let errorFired = false;
  const fireError = (msg: string) => {
    if (errorFired) return;
    errorFired = true;
    onError(msg);
  };

  ws.onerror = () => fireError('Erro de ligação WebSocket');

  ws.onclose = (event: CloseEvent) => {
    if (!event.wasClean) {
      fireError('Ligação WebSocket perdida inesperadamente');
    }
  };

  return {
    sendChunk(float32: Float32Array) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(float32.buffer);
      }
    },
    updateThreshold(threshold: number) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ threshold }));
      }
    },
    close() {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    },
  };
}
