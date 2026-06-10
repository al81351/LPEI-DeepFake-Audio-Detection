import type { ArtifactMetrics } from '../types/analysis';

interface ArtifactScoresProps {
  artifacts: ArtifactMetrics;
}

const LABELS: Record<string, string> = {
  over_smoothing:          'Sobre-suavização',
  artificial_periodicity:  'Periodicidade Artificial',
  spectral_discontinuity:  'Descontinuidades Espectrais',
};

function scoreColor(score: number): string {
  if (score < 0.3) return 'var(--color-safe)';
  if (score < 0.6) return 'var(--color-warn)';
  return 'var(--color-danger)';
}

interface ProgressBarProps {
  label: string;
  score: number;
}

function ProgressBar({ label, score }: ProgressBarProps) {
  const color = scoreColor(score);
  const pct   = Math.round(score * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </span>
        <span
          className="font-mono text-sm font-semibold tabular"
          style={{ color }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
    </div>
  );
}

export function ArtifactScores({ artifacts }: ArtifactScoresProps) {
  const scores = [
    { key: 'over_smoothing',         score: artifacts.over_smoothing_score          },
    { key: 'artificial_periodicity', score: artifacts.artificial_periodicity_score  },
    { key: 'spectral_discontinuity', score: artifacts.spectral_discontinuity_score  },
  ];

  return (
    <div className="glass-card p-5 flex flex-col gap-5">
      {/* Cabeçalho + badges */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3
          className="text-xs font-mono font-medium uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
        >
          Artefactos de Síntese
        </h3>

        {artifacts.artifacts_detected.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {artifacts.artifacts_detected.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
                style={{
                  background:  'rgba(255,51,102,0.14)',
                  border:      '1px solid rgba(255,51,102,0.4)',
                  color:       'var(--color-danger)',
                }}
              >
                {LABELS[name] ?? name}
              </span>
            ))}
          </div>
        )}

        {artifacts.artifacts_detected.length === 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
            style={{
              background: 'rgba(0,255,136,0.1)',
              border:     '1px solid rgba(0,255,136,0.3)',
              color:      'var(--color-safe)',
            }}
          >
            Nenhum detectado
          </span>
        )}
      </div>

      {/* Barras de progresso */}
      <div className="flex flex-col gap-4">
        {scores.map(({ key, score }) => (
          <ProgressBar key={key} label={LABELS[key] ?? key} score={score} />
        ))}
      </div>
    </div>
  );
}
