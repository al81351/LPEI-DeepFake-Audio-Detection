import { useEffect, useRef, useState } from 'react';
import { getAlertLevel } from '../types/analysis';

interface SyntheticityGaugeProps {
  value: number;
  threshold: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { vb: 140, cx: 70,  cy: 70,  r: 54,  sw: 9,  numSz: 26, labSz: 8,  labOff: 16 },
  md: { vb: 200, cx: 100, cy: 100, r: 80,  sw: 12, numSz: 36, labSz: 10, labOff: 20 },
  lg: { vb: 280, cx: 140, cy: 140, r: 112, sw: 16, numSz: 50, labSz: 13, labOff: 28 },
} as const;

const COLOR_MAP = {
  safe:   'var(--color-safe)',
  warn:   'var(--color-warn)',
  danger: 'var(--color-danger)',
};

export function SyntheticityGauge({
  value,
  threshold,
  size = 'md',
}: SyntheticityGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef        = useRef<number | null>(null);
  const startTimeRef  = useRef<number | null>(null);
  const currentValRef = useRef(0); // always tracks the last rendered value

  useEffect(() => {
    const duration = 400;
    const from = currentValRef.current; // start from wherever the gauge actually is now
    const to   = value;
    startTimeRef.current = null;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed  = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const newVal   = from + (to - from) * eased;
      currentValRef.current = newVal;
      setDisplayValue(newVal);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const { vb, cx, cy, r, sw, numSz, labSz, labOff } = SIZE_MAP[size];
  const circumference = 2 * Math.PI * r;
  const arcLength     = circumference * 0.75;           // 270° de 360°
  const dashOffset    = arcLength * (1 - displayValue / 100);
  const color         = COLOR_MAP[getAlertLevel(displayValue, threshold)];

  return (
    <svg
      viewBox={`0 0 ${vb} ${vb}`}
      width={vb}
      height={vb}
      style={{ maxWidth: '100%', overflow: 'visible' }}
      aria-label={`Índice de sinteticidade: ${Math.round(displayValue)}%`}
      role="img"
    >
      {/* Arco de fundo */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={sw}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Arco de progresso — inicia 7h30 (135°), percorre 270° no sentido horário */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
          transition: 'stroke 250ms ease',
        }}
      />
      {/* Número central */}
      <text
        x={cx}
        y={cy - labOff / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize={numSz}
        fontWeight="700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(displayValue)}%
      </text>
      {/* Label "SINTETICIDADE" */}
      <text
        x={cx}
        y={cy + numSz / 2 + labOff / 2 + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.35)"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={labSz}
        fontWeight="500"
        letterSpacing="3"
      >
        SINTETICIDADE
      </text>
    </svg>
  );
}
