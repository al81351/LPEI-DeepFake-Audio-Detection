import { useState, useRef, useEffect } from 'react';
import { useRealtimeStream } from '../hooks/useRealtimeStream';
import { SyntheticityGauge } from './SyntheticityGauge';
import { ThresholdSlider }   from './ThresholdSlider';

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div
        className="text-xs uppercase tracking-widest font-mono mb-1"
        style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em' }}
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

const EMA_ALPHA = 0.3; // responsiveness vs stability (higher = more reactive)

export function RealtimeAnalysis() {
  const [threshold, setThreshold]               = useState(50);
  const { update, status, error, startCapture, stopCapture } = useRealtimeStream();

  // Smoothed display value using Exponential Moving Average
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

  const handleToggle = () => {
    if (isCapturing) {
      stopCapture();
    } else {
      void startCapture(threshold);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Estado + botão ─────────────────────────────────── */}
      <div className="glass-card p-5 flex items-center justify-between gap-4">
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

        <button
          onClick={handleToggle}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-widest transition-all duration-200"
          style={{
            background:    isCapturing ? 'rgba(255,51,102,0.12)' : 'var(--color-accent)',
            color:         isCapturing ? 'var(--color-danger)'   : 'oklch(10% 0.01 260)',
            border:        isCapturing ? '1px solid rgba(255,51,102,0.45)' : 'none',
            letterSpacing: '0.1em',
            boxShadow:     !isCapturing ? '0 0 20px oklch(70% 0.18 250 / 0.3)' : 'none',
            cursor: 'pointer',
          }}
        >
          {isCapturing ? 'Parar Captura' : 'Iniciar Captura'}
        </button>
      </div>

      {/* Erro de microfone / WebSocket */}
      {status === 'error' && error && (
        <div
          className="px-4 py-3 rounded-lg text-sm animate-fade-in"
          style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.25)', color: 'var(--color-danger)' }}
        >
          {error}
        </div>
      )}

      {/* ── Gauge central ──────────────────────────────────── */}
      <div className="flex flex-col items-center py-4">
        <SyntheticityGauge
          value={smoothedIndex}
          threshold={threshold}
          size="lg"
        />
        {update && (
          <div
            className="mt-2 font-mono text-sm tabular"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            buffer: {update.buffer_seconds.toFixed(2)}s
          </div>
        )}
      </div>

      {/* ── 2 mini cards ───────────────────────────────────── */}
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

      {/* ── Limiar (desactivado durante captura) ───────────── */}
      <div className="glass-card p-5">
        <ThresholdSlider
          value={threshold}
          onChange={setThreshold}
          disabled={isCapturing}
        />
        {isCapturing && (
          <p
            className="text-xs font-mono mt-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Altere o limiar após parar a captura.
          </p>
        )}
      </div>

      {/* Nota técnica */}
      <p
        className="text-xs text-center font-mono px-4"
        style={{ color: 'rgba(255,255,255,0.22)', lineHeight: 1.7 }}
      >
        Espectrograma e artefactos detalhados não estão disponíveis em tempo real
        para garantir latência ≤ 200 ms (RNF-01).
      </p>
    </div>
  );
}
