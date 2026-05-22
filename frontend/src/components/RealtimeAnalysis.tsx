import { useState } from 'react';
import { useRealtimeStream } from '../hooks/useRealtimeStream';
import { SyntheticityGauge }  from './SyntheticityGauge';
import { ThresholdSlider }    from './ThresholdSlider';
import { RealtimeProbeLog }   from './RealtimeProbeLog';
import { VoicePoweredOrb }    from './ui/voice-powered-orb';
import type { RealtimeProbe } from '../types/analysis';

// ─── Recent probe row ─────────────────────────────────────────────────────────

function RecentProbeRow({ probe }: { probe: RealtimeProbe }) {
  const isHuman = probe.label === 'real';
  const time = new Date(probe.timestamp).toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: isHuman ? 'var(--color-safe)' : 'var(--color-danger)' }}
      />
      <span className="font-mono text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {probe.probe_id}
      </span>
      <span className="font-mono text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {time}
      </span>
      <span
        className="font-mono text-xs font-semibold ml-auto flex-shrink-0"
        style={{ color: isHuman ? 'var(--color-safe)' : 'var(--color-danger)' }}
      >
        {isHuman ? 'HUMANO' : 'SINTÉTICO'}
      </span>
      <span className="font-mono text-xs tabular flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {probe.syntheticity_index.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RealtimeAnalysis() {
  const [threshold, setThreshold] = useState(50);
  const [showLogs, setShowLogs]   = useState(false);

  const {
    tick, latestProbe, probes,
    status, error,
    startCapture, stopCapture, clearProbes,
  } = useRealtimeStream();

  const isCapturing = status === 'capturing';
  const isAlert     = (latestProbe?.syntheticity_index ?? 0) >= threshold;
  const recentProbes = probes.slice(0, 3);

  // Drive the orb with RMS energy from the WebSocket tick (no second mic needed)
  const orbAudioLevel = isCapturing
    ? Math.max(0.12, Math.min((tick?.rms_energy ?? 0) * 18, 1))
    : undefined;

  const authLabel = (() => {
    if (!latestProbe) return null;
    return latestProbe.label === 'real'
      ? { text: 'Humano',   bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  color: 'var(--color-safe)'   }
      : { text: 'Sintético', bg: 'rgba(255,51,102,0.12)', border: 'rgba(255,51,102,0.25)', color: 'var(--color-danger)' };
  })();

  const handleStartStop = () => {
    if (isCapturing) stopCapture();
    else void startCapture(threshold);
  };

  return (
    <>
      {showLogs && (
        <RealtimeProbeLog
          probes={probes}
          onClose={() => setShowLogs(false)}
          onClear={clearProbes}
        />
      )}

      <div className="flex flex-col gap-5">
        {/* Section header */}
        <div>
          <h2 className="font-mono font-bold text-xl mb-1" style={{ color: 'var(--color-accent)' }}>
            Análise em Tempo Real
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Probes independentes de 3 s com análise completa de artefactos.
          </p>
        </div>

        {/* Error banner */}
        {status === 'error' && error && (
          <div
            className="px-4 py-3 rounded-xl text-sm animate-fade-in"
            style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.25)', color: 'var(--color-danger)' }}
          >
            {error}
          </div>
        )}

        {/* Main two-column panel */}
        <div className="glass-card p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── Left column: socket info + orb + start/stop ── */}
          <div className="flex flex-col items-center gap-4">

            {/* Socket status + latency — inside the card, above the orb */}
            <div className="w-full flex items-center justify-between">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: isCapturing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isCapturing ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.09)'}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isCapturing ? 'var(--color-safe)' : 'rgba(255,255,255,0.2)',
                    boxShadow: isCapturing ? '0 0 5px var(--color-safe)' : 'none',
                    animation: isCapturing ? 'capture-pulse 2s ease-in-out infinite' : 'none',
                  }}
                />
                <span className="font-mono text-xs font-medium" style={{ color: isCapturing ? 'var(--color-safe)' : 'rgba(255,255,255,0.3)' }}>
                  {isCapturing ? 'SOCKET ATIVO' : 'SOCKET INATIVO'}
                </span>
              </div>

              <div className="text-right">
                <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  LATÊNCIA
                </div>
                <div
                  className="font-mono text-sm font-bold tabular leading-tight"
                  style={{ color: latestProbe ? 'var(--color-safe)' : 'rgba(255,255,255,0.2)' }}
                >
                  {latestProbe ? `${latestProbe.latency_ms} ms` : '—'}
                </div>
              </div>
            </div>

            {/* WebGL Orb */}
            <div style={{ width: 200, height: 200 }}>
              <VoicePoweredOrb
                audioLevel={orbAudioLevel}
                enableVoiceControl={false}
                hue={0}
                maxRotationSpeed={1.2}
                maxHoverIntensity={0.8}
              />
            </div>

            {/* Start / Stop button — directly below the orb */}
            <button
              onClick={handleStartStop}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full font-mono font-semibold text-sm transition-all duration-300"
              style={isCapturing ? {
                background:  'rgba(255,51,102,0.12)',
                border:      '1px solid rgba(255,51,102,0.32)',
                color:       'var(--color-danger)',
                boxShadow:   '0 0 18px rgba(255,51,102,0.18)',
              } : {
                background:  'rgba(34,197,94,0.12)',
                border:      '1px solid rgba(34,197,94,0.32)',
                color:       'var(--color-safe)',
                boxShadow:   '0 0 18px rgba(34,197,94,0.12)',
              }}
            >
              {isCapturing ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Parar Captura
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="7" />
                  </svg>
                  Iniciar Captura
                </>
              )}
            </button>
          </div>

          {/* ── Right column: gauge + verdict ── */}
          <div className="flex flex-col items-center gap-4">
            <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.22)' }}>
              ÍNDICE DE SINTETICIDADE
            </div>

            <SyntheticityGauge
              value={latestProbe?.syntheticity_index ?? 0}
              threshold={threshold}
              size="md"
            />

            {authLabel ? (
              <div
                className="w-full text-center py-3 rounded-xl font-mono font-bold text-base animate-fade-in"
                style={{ background: authLabel.bg, border: `1px solid ${authLabel.border}`, color: authLabel.color }}
              >
                {authLabel.text}
              </div>
            ) : (
              <div
                className="w-full text-center py-3 rounded-xl font-mono text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.18)' }}
              >
                Aguardando primeiro probe...
              </div>
            )}

          </div>
        </div>

        {/* Threshold slider */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <ThresholdSlider
            value={threshold}
            onChange={setThreshold}
            disabled={isCapturing}
          />
          {isCapturing && (
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Altere o limiar após parar a captura.
            </p>
          )}
        </div>

        {/* Recent Probes */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Probes Recentes
            </h3>
            <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {probes.length} total
            </span>
          </div>

          {recentProbes.length === 0 ? (
            <div className="py-4 text-center font-mono text-sm" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Aguardando probes...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentProbes.map(p => <RecentProbeRow key={p.probe_id} probe={p} />)}
            </div>
          )}

          <button
            onClick={() => setShowLogs(true)}
            className="font-mono text-xs mt-1 text-left transition-opacity"
            style={{ color: 'var(--color-accent)', opacity: probes.length > 0 ? 0.8 : 0.35, cursor: probes.length > 0 ? 'pointer' : 'default' }}
          >
            Ver Logs Forenses Completos →
          </button>
        </div>
      </div>
    </>
  );
}
