import type { AcousticMetrics, SpectralMetrics } from '../types/analysis';

interface MetricsDashboardProps {
  acoustic: AcousticMetrics;
  spectral: SpectralMetrics;
}

interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  description: string;
  normalizedValue: number; // 0–1 for mini bar
  barColor?: string;
}

import React from 'react';

function MetricCard({ label, value, unit, icon, description, normalizedValue, barColor = 'var(--color-accent)' }: MetricCardProps) {
  const clampedNorm = Math.min(1, Math.max(0, normalizedValue));

  return (
    <div
      className="glass-card p-4 flex flex-col gap-3 group transition-all duration-200 cursor-default"
      title={description}
      style={{ borderTop: `2px solid ${barColor}` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="text-xs uppercase tracking-widest font-mono leading-tight"
          style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em' }}
        >
          {label}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div
        className="font-mono font-bold text-2xl tabular leading-none"
        style={{ color: barColor }}
      >
        {value.toFixed(value < 1 ? 5 : 2)}
        {unit && (
          <span
            className="text-xs ml-1.5 font-normal"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Mini bar */}
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-1 rounded-full"
          style={{
            width: `${clampedNorm * 100}%`,
            background: barColor,
            boxShadow: `0 0 6px ${barColor}`,
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
            opacity: 0.75,
          }}
        />
      </div>
    </div>
  );
}

function SectionHeading({ children, accent = 'var(--color-accent)' }: { children: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-0.5 h-4 rounded-full flex-shrink-0"
        style={{ background: accent }}
      />
      <h3
        className="text-xs font-mono font-medium uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}
      >
        {children}
      </h3>
    </div>
  );
}

// Icons
const DurationIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FrequencyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h3l3-9 3 18 3-9h4" /><line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

const EnergyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ZeroIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const CentroidIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 0 0 0 11.31" /><path d="M17.7 6.3a8 8 0 0 1 0 11.31" />
  </svg>
);

const RolloffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M3 12c5 0 6-6 9-6s4 6 9 6" />
  </svg>
);

const FlatnessIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export function MetricsDashboard({ acoustic, spectral }: MetricsDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHeading>Métricas Acústicas</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Duração"
            value={acoustic.duration_seconds}
            unit="s"
            icon={<DurationIcon />}
            description="Duração total do ficheiro de áudio em segundos."
            normalizedValue={acoustic.duration_seconds / 30}
            barColor="var(--color-accent)"
          />
          <MetricCard
            label="Freq. Dominante"
            value={acoustic.dominant_frequency}
            unit="Hz"
            icon={<FrequencyIcon />}
            description="A frequência mais proeminente no espectro de áudio."
            normalizedValue={acoustic.dominant_frequency / 4000}
            barColor="oklch(70% 0.18 250)"
          />
          <MetricCard
            label="Energia RMS"
            value={acoustic.rms_energy}
            unit=""
            icon={<EnergyIcon />}
            description="Energia quadrática média — indica a intensidade sonora geral."
            normalizedValue={acoustic.rms_energy / 0.15}
            barColor="var(--color-safe)"
          />
          <MetricCard
            label="Taxa Zero-Cross."
            value={acoustic.zero_crossing_rate}
            unit=""
            icon={<ZeroIcon />}
            description="Taxa de mudança de sinal — alta em sons não-tonais e fricativas."
            normalizedValue={acoustic.zero_crossing_rate / 0.25}
            barColor="var(--color-warn)"
          />
        </div>
      </div>

      <div>
        <SectionHeading accent="oklch(70% 0.18 220)">Métricas Espectrais</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard
            label="Centróide Espectral"
            value={spectral.spectral_centroid}
            unit="Hz"
            icon={<CentroidIcon />}
            description="Centro de massa espectral — voz sintética tende a ter centróide mais elevado."
            normalizedValue={spectral.spectral_centroid / 5000}
            barColor="oklch(70% 0.18 220)"
          />
          <MetricCard
            label="Rolloff Espectral"
            value={spectral.spectral_rolloff}
            unit="Hz"
            icon={<RolloffIcon />}
            description="Frequência abaixo da qual reside 85% da energia espectral."
            normalizedValue={spectral.spectral_rolloff / 8000}
            barColor="oklch(68% 0.16 230)"
          />
          <MetricCard
            label="Planura Espectral"
            value={spectral.spectral_flatness}
            unit=""
            icon={<FlatnessIcon />}
            description="Mede o quão uniforme é o espectro — voz sintética é mais 'plana' (0.01–0.15)."
            normalizedValue={spectral.spectral_flatness / 0.15}
            barColor={spectral.spectral_flatness > 0.01 ? 'var(--color-danger)' : 'var(--color-safe)'}
          />
        </div>
      </div>
    </div>
  );
}
