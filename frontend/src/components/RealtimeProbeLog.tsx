import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { RealtimeProbe } from '../types/analysis';

interface Props {
  probes: RealtimeProbe[];
  onClose: () => void;
  onClear: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDiagnosis(probe: RealtimeProbe): string {
  const { over_smoothing_score: os, artificial_periodicity_score: ap, spectral_discontinuity_score: sd } = probe.metrics;
  const max = Math.max(os, ap, sd);
  const isHuman = !probe.is_alert;

  if (isHuman && max < 0.3)
    return 'Padrões biométricos dentro dos limites humanos normais. Variação natural de pitch e timbre confirmada.';
  if (isHuman && max < 0.6)
    return 'Características vocais maioritariamente humanas. Alguns artefactos menores detetados, dentro do aceitável.';
  if (!isHuman && max > 0.7)
    return 'Artefactos de síntese neural detetados. Padrões espectrais inconsistentes com voz humana natural.';
  if (!isHuman)
    return 'Probabilidade elevada de síntese artificial. Verificar suavização excessiva e periodicidade irregular.';
  return 'Análise inconclusiva. Métricas marginais — recomenda-se análise adicional.';
}

// ─── Expanded details (Vaani.io 3-column style) ───────────────────────────────

function ExpandedDetails({ probe }: { probe: RealtimeProbe }) {
  const { over_smoothing_score: os, artificial_periodicity_score: ap, spectral_discontinuity_score: sd,
          rms_energy, zero_crossing_rate } = probe.metrics;

  const dotColor = (v: number) => v > 0.5 ? 'var(--color-danger)' : 'var(--color-safe)';

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Column 1 — Signal Metrics */}
      <div className="px-5 py-4 flex flex-col gap-2.5 border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Métricas de Sinal
        </span>
        {[
          { label: 'Over-Smoothing',    val: `${Math.round(os * 100)}%` },
          { label: 'Periodicidade',     val: `${Math.round(ap * 100)}%` },
          { label: 'Descontinuidade',   val: `${Math.round(sd * 100)}%` },
          { label: 'Energia RMS',       val: rms_energy.toFixed(4) },
          { label: 'Zero-Crossing',     val: zero_crossing_rate.toFixed(4) },
        ].map(({ label, val }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            <span className="font-mono text-xs tabular font-semibold" style={{ color: 'var(--color-accent)' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Column 2 — Forensic Integrity */}
      <div className="px-5 py-4 flex flex-col gap-2.5 border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Integridade Forense
        </span>
        {[
          { label: 'Suavização Excessiva',  ok: os < 0.5 },
          { label: 'Periodicidade Artif.',  ok: ap < 0.5 },
          { label: 'Descont. Espectral',    ok: sd < 0.5 },
          { label: 'Energia Normal',        ok: rms_energy > 0.002 && rms_energy < 0.5 },
          { label: 'ZCR Coerente',          ok: zero_crossing_rate > 0.01 && zero_crossing_rate < 0.4 },
        ].map(({ label, ok }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: ok ? 'var(--color-safe)' : 'var(--color-danger)', boxShadow: `0 0 5px ${ok ? 'var(--color-safe)' : 'var(--color-danger)'}` }}
            />
          </div>
        ))}
      </div>

      {/* Column 3 — Neural Diagnosis */}
      <div className="px-5 py-4 flex flex-col gap-2.5">
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Diagnóstico Neural
        </span>
        <div
          className="rounded-lg p-3 flex-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="font-mono text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
            DEEPFAKE_NEURAL_LOG
          </div>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
            "{getDiagnosis(probe)}"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Probe row ────────────────────────────────────────────────────────────────

function ProbeRow({ probe }: { probe: RealtimeProbe }) {
  const [expanded, setExpanded] = useState(false);
  const isHuman = !probe.is_alert;
  const syntheticity = probe.syntheticity_index.toFixed(1);
  const time = new Date(probe.timestamp).toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div
      className="rounded-xl overflow-hidden shrink-0"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Main row */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-5 min-w-0"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Status icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isHuman ? 'rgba(34,197,94,0.15)' : 'rgba(255,51,102,0.12)',
            border: `1px solid ${isHuman ? 'rgba(34,197,94,0.3)' : 'rgba(255,51,102,0.28)'}`,
          }}
        >
          {isHuman ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-safe)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )}
        </div>

        {/* Probe ID */}
        <div className="flex flex-col min-w-0 w-40 flex-shrink-0">
          <span className="font-mono text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Probe ID</span>
          <span className="font-mono text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{probe.probe_id}</span>
        </div>

        {/* Syntheticity */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-mono text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Sinteticidade</span>
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-base font-bold tabular"
              style={{ color: isHuman ? 'var(--color-safe)' : 'var(--color-danger)' }}
            >
              {syntheticity}%
            </span>
            <span
              className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isHuman ? 'rgba(34,197,94,0.15)' : 'rgba(255,51,102,0.12)',
                color: isHuman ? 'var(--color-safe)' : 'var(--color-danger)',
                border: `1px solid ${isHuman ? 'rgba(34,197,94,0.3)' : 'rgba(255,51,102,0.28)'}`,
              }}
            >
              {isHuman ? 'Human' : 'Synthetic'}
            </span>
          </div>
        </div>

        {/* Timestamp + Latency */}
        <div className="flex flex-col flex-shrink-0 hidden sm:flex">
          <span className="font-mono text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Timestamp</span>
          <span className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{time}</span>
          <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{probe.latency_ms} ms</span>
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.28)" strokeWidth="2"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded section */}
      {expanded && <ExpandedDetails probe={probe} />}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LogsModal({ probes, onClose, onClear }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const exportCsv = () => {
    const rows = [
      'Probe ID,Sinteticidade %,Label,Latência ms,RMS,ZCR,Over-Smoothing,Periodicidade,Descontinuidade,Timestamp',
      ...probes.map(p =>
        [p.probe_id, p.syntheticity_index.toFixed(2),
         p.label, p.latency_ms, p.metrics.rms_energy, p.metrics.zero_crossing_rate,
         p.metrics.over_smoothing_score, p.metrics.artificial_periodicity_score,
         p.metrics.spectral_discontinuity_score, p.timestamp].join(',')
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepfake-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 9999, background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div>
          <h2 className="font-mono font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Logs Forenses de Segurança
          </h2>
          <p className="font-mono text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {probes.length} probe{probes.length !== 1 ? 's' : ''} nesta sessão
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {probes.length > 0 && (
            <>
              <button
                onClick={exportCsv}
                className="font-mono text-xs px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)' }}
              >
                Exportar CSV
              </button>
              <button
                onClick={onClear}
                className="font-mono text-xs px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid rgba(255,51,102,0.38)', color: 'var(--color-danger)', background: 'rgba(255,51,102,0.08)' }}
              >
                Limpar Logs
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Probe list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {probes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.18)' }}>Sem probes nesta sessão</p>
          </div>
        ) : (
          probes.map(p => <ProbeRow key={p.probe_id} probe={p} />)
        )}
      </div>
    </div>
  );
}

export function RealtimeProbeLog(props: Props) {
  return createPortal(<LogsModal {...props} />, document.body);
}
