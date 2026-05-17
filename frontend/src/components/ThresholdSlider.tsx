import { Slider } from '@ark-ui/react/slider';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MARKERS = [0, 25, 50, 75, 100];

export function ThresholdSlider({
  value,
  onChange,
  disabled = false,
}: ThresholdSliderProps) {
  return (
    <Slider.Root
      value={[value]}
      min={0}
      max={100}
      step={1}
      disabled={disabled}
      onValueChange={(details) => onChange(details.value[0])}
      style={{ width: '100%' }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <Slider.Label
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Limiar de Alerta
        </Slider.Label>
        <Slider.ValueText
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-accent)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '2px 8px',
          }}
        >
          {value}%
        </Slider.ValueText>
      </div>

      <Slider.Control>
        <Slider.Track
          style={{
            height: '4px',
            background: 'rgba(255,255,255,0.10)',
            borderRadius: '2px',
            position: 'relative',
          }}
        >
          <Slider.Range
            style={{
              height: '100%',
              background: 'var(--color-accent)',
              borderRadius: '2px',
              boxShadow: '0 0 8px oklch(70% 0.18 250 / 0.5)',
            }}
          />
        </Slider.Track>

        <Slider.Thumb
          index={0}
          style={{
            width: '16px',
            height: '16px',
            background: 'var(--color-accent)',
            borderRadius: '50%',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 10px oklch(70% 0.18 250 / 0.6)',
            outline: 'none',
            transition: 'transform 150ms, box-shadow 150ms',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.25)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px oklch(70% 0.18 250 / 0.8)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px oklch(70% 0.18 250 / 0.6)';
          }}
        >
          <Slider.HiddenInput />
        </Slider.Thumb>
      </Slider.Control>

      {/* Tick marks */}
      <Slider.MarkerGroup
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10px',
        }}
      >
        {MARKERS.map((v) => (
          <Slider.Marker
            key={v}
            value={v}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            {v}%
          </Slider.Marker>
        ))}
      </Slider.MarkerGroup>
    </Slider.Root>
  );
}
