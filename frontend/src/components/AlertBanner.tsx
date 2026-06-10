interface AlertBannerProps {
  isAlert: boolean;
  label: 'real' | 'synthetic';
  confidence: number;
  syntheticityIndex: number;
}

export function AlertBanner({
  isAlert,
  label,
  confidence,
  syntheticityIndex,
}: AlertBannerProps) {
  const isSynthetic = label === 'synthetic';
  const accentColor = isSynthetic ? 'var(--color-danger)' : 'var(--color-safe)';
  const bgColor     = isSynthetic ? 'rgba(255,51,102,0.08)' : 'rgba(0,255,136,0.07)';
  const borderColor = isSynthetic ? 'rgba(255,51,102,0.35)' : 'rgba(0,255,136,0.3)';

  return (
    <div
      className="rounded-xl p-5 flex items-center justify-between gap-4"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'var(--glass-blur)',
        animation: isAlert ? 'border-pulse 1.5s ease-in-out infinite' : undefined,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
            animation: isAlert ? 'dot-blink 1.2s ease-in-out infinite' : undefined,
          }}
        />
        <div>
          <div
            className="font-mono font-bold text-lg tracking-wider"
            style={{ color: accentColor, letterSpacing: '0.12em' }}
          >
            {isSynthetic ? 'SINTÉTICO' : 'REAL'}
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {isSynthetic
              ? `Índice de Sinteticidade: ${syntheticityIndex.toFixed(1)}%`
              : `Áudio classificado como genuíno`}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div
          className="text-xs uppercase tracking-widest font-mono"
          style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
        >
          {isAlert ? 'ALERTA ACTIVO' : 'Estado Normal'}
        </div>
        <div
          className="font-mono font-semibold mt-0.5 tabular"
          style={{ color: accentColor }}
        >
          {confidence.toFixed(1)}% confiança
        </div>
      </div>
    </div>
  );
}
