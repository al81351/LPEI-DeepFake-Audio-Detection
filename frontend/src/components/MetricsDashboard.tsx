import type { AcousticMetrics, SpectralMetrics } from '../types/analysis';

interface MetricsDashboardProps {
  acoustic: AcousticMetrics;
  spectral: SpectralMetrics;
}

interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
}

function MetricCard({ label, value, unit }: MetricCardProps) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1.5">
      <div
        className="text-xs uppercase tracking-widest font-mono"
        style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em' }}
      >
        {label}
      </div>
      <div
        className="font-mono font-semibold text-lg tabular leading-none"
        style={{ color: 'var(--color-accent)' }}
      >
        {value.toFixed(4)}
        {unit && (
          <span
            className="text-xs ml-1.5 font-normal"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3
      className="text-xs font-mono font-medium uppercase tracking-widest mb-3"
      style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
    >
      {children}
    </h3>
  );
}

export function MetricsDashboard({ acoustic, spectral }: MetricsDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading>Métricas Acústicas</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Duração"              value={acoustic.duration_seconds}    unit="s"  />
          <MetricCard label="Frequência Dominante" value={acoustic.dominant_frequency}  unit="Hz" />
          <MetricCard label="Energia RMS"          value={acoustic.rms_energy}                    />
          <MetricCard label="Taxa Zero-Crossing"   value={acoustic.zero_crossing_rate}            />
        </div>
      </div>

      <div>
        <SectionHeading>Métricas Espectrais</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard label="Centróide Espectral" value={spectral.spectral_centroid} unit="Hz" />
          <MetricCard label="Rolloff Espectral"   value={spectral.spectral_rolloff}  unit="Hz" />
          <MetricCard label="Planura Espectral"   value={spectral.spectral_flatness}            />
        </div>
      </div>
    </div>
  );
}
