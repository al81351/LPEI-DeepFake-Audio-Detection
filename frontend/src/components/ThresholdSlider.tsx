interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ThresholdSlider({
  value,
  onChange,
  disabled = false,
}: ThresholdSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          className="text-xs font-mono font-medium uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}
        >
          Limiar de Alerta
        </label>
        <span
          className="font-mono text-sm font-semibold px-2 py-0.5 rounded-md tabular"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--color-accent)',
          }}
        >
          {value}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label={`Limiar de alerta: ${value}%`}
      />

      <div
        className="flex justify-between text-xs font-mono"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
