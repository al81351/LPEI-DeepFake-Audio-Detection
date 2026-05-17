import { useState, useRef, useEffect } from 'react';
import { useRealtimeStream } from '../hooks/useRealtimeStream';
import { SyntheticityGauge } from './SyntheticityGauge';
import { ThresholdSlider }   from './ThresholdSlider';
import { VoiceInput }        from './ui/voice-input';

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div
        className="text-xs uppercase tracking-widest font-mono mb-1.5"
        style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em' }}
      >
        {label}
      </div>
      <div
        className="font-mono text-2xl font-bold tabular"
        style={{ color: 'var(--color-accent)' }}
      >
        {value}
      </div>
    </div>
  );
}

const EMA_ALPHA = 0.3;

export function RealtimeAnalysis() {
  const [threshold, setThreshold]               = useState(50);
  const { update, status, error, startCapture, stopCapture } = useRealtimeStream();

  const [smoothedIndex, setSmoothedIndex] = useState(0);
  const emaRef = useRef<number | null>(null);

  useEffect(() => {
    if (!update) {
      emaRef.current = null;
      setSmoothedIndex(0);
      return;
    }
    const raw = update.syntheticity_index;
    const ema = emaRef.current === null
      ? raw
      : EMA_ALPHA * raw + (1 - EMA_ALPHA) * emaRef.current;
    emaRef.current = ema;
    setSmoothedIndex(ema);
  }, [update]);

  const isCapturing = status === 'capturing';
  const isAlert     = smoothedIndex >= threshold;

  const statusCfg = (() => {
    if (status === 'idle')  return { label: 'Inativo',       color: 'rgba(255,255,255,0.35)', dotColor: 'rgba(255,255,255,0.2)',  dotAnim: undefined };
    if (status === 'error') return { label: 'Erro',          color: 'var(--color-danger)',    dotColor: 'var(--color-danger)',     dotAnim: undefined };
    if (isAlert)            return { label: 'Alerta Activo', color: 'var(--color-danger)',    dotColor: 'var(--color-danger)',     dotAnim: 'border-pulse 1.5s ease-in-out infinite' };
    return                         { label: 'A Capturar',   color: 'var(--color-safe)',      dotColor: 'var(--color-safe)',       dotAnim: 'capture-pulse 2s ease-in-out infinite' };
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div>
        <h2
          className="font-mono font-bold text-xl mb-1"
          style={{ color: 'var(--color-accent)' }}
        >
          Análise em Tempo Real
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Captura contínua via microfone com latência ≤ 200 ms.
        </p>
      </div>

      {/* Status indicator + VoiceInput control */}
      <div className="glass-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              background: statusCfg.dotColor,
              boxShadow:  isCapturing ? `0 0 8px ${statusCfg.dotColor}` : 'none',
              animation:  statusCfg.dotAnim,
            }}
          />
          <span className="font-mono font-medium text-sm" style={{ color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>

        <VoiceInput
          isActive={isCapturing}
          onStart={() => void startCapture(threshold)}
          onStop={() => stopCapture()}
        />
      </div>

      {/* Microphone/WebSocket error */}
      {status === 'error' && error && (
        <div
          className="px-4 py-3 rounded-xl text-sm animate-fade-in"
          style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.25)', color: 'var(--color-danger)' }}
        >
          {error}
        </div>
      )}

      {/* Central gauge */}
      <div className="flex flex-col items-center py-2">
        <SyntheticityGauge
          value={smoothedIndex}
          threshold={threshold}
          size="lg"
        />
        {update && (
          <div
            className="mt-2 font-mono text-sm tabular"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            buffer: {update.buffer_seconds.toFixed(2)}s
          </div>
        )}
      </div>

      {/* Mini metric cards */}
      <div className="grid grid-cols-2 gap-4">
        <MiniCard
          label="Energia RMS"
          value={update?.realtime_metrics.rms_energy.toFixed(4) ?? '—'}
        />
        <MiniCard
          label="Taxa Zero-Crossing"
          value={update?.realtime_metrics.zero_crossing_rate.toFixed(4) ?? '—'}
        />
      </div>

      {/* Threshold slider */}
      <div className="glass-card p-4">
        <ThresholdSlider
          value={threshold}
          onChange={setThreshold}
          disabled={isCapturing}
        />
        {isCapturing && (
          <p
            className="text-xs font-mono mt-3"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            Altere o limiar após parar a captura.
          </p>
        )}
      </div>

      <p
        className="text-xs text-center font-mono px-4"
        style={{ color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}
      >
        Espectrograma e artefactos detalhados não estão disponíveis em tempo real
        para garantir latência ≤ 200 ms (RNF-01).
      </p>
    </div>
  );
}
